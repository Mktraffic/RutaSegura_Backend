import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDriverDto, UpdateDriverDto } from "./dto/driver.dto";

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly driverSelect = {
    id: true,
    personType: true,
    firstName: true,
    middleName: true,
    firstLastname: true,
    secondLastname: true,
    phone: true,
    email: true,
    status: true,
    createdAt: true,
    users: {
      select: {
        id: true,
        email: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    personDocumentLinks: {
      select: {
        id: true,
        documentRole: true,
        personDocument: {
          select: {
            id: true,
            documentNumber: true,
            description: true,
            status: true,
            documentType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    },
  } satisfies Prisma.PersonSelect;

  async create(dto: CreateDriverDto) {
    await this.validateCreateBusinessRules(dto);
    const documentTypeId = await this.resolveDocumentTypeId(dto.document.documentType);

    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          personType: "DRIVER",
          firstName: dto.firstName,
          middleName: dto.middleName,
          firstLastname: dto.firstLastname,
          secondLastname: dto.secondLastname,
          phone: dto.phone,
          email: dto.email,
          status: "ACTIVE",
        },
      });

      const document = await tx.personDocument.create({
        data: {
          documentTypeId,
          documentNumber: dto.document.documentNumber,
          description: dto.document.description,
          status: "ACTIVE",
        },
      });

      await tx.personDocumentLink.create({
        data: {
          personId: person.id,
          personDocumentId: document.id,
          documentRole: dto.document.documentRole ?? "DRIVER_ID",
        },
      });

      return this.findOneByIdInternal(tx, person.id);
    });
  }

  async findAll(query?: string) {
    return this.prisma.person.findMany({
      where: {
        personType: "DRIVER",
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { middleName: { contains: query, mode: "insensitive" } },
                { firstLastname: { contains: query, mode: "insensitive" } },
                { secondLastname: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                {
                  personDocumentLinks: {
                    some: {
                      personDocument: {
                        documentNumber: {
                          contains: query,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ firstName: "asc" }, { firstLastname: "asc" }],
      select: this.driverSelect,
    });
  }

  async findOne(id: number) {
    const driver = await this.prisma.person.findFirst({
      where: {
        id,
        personType: "DRIVER",
      },
      select: this.driverSelect,
    });

    if (!driver) {
      throw new NotFoundException({
        success: false,
        message: "Conductor no encontrado",
      });
    }

    return driver;
  }

  async update(id: number, dto: UpdateDriverDto) {
    await this.ensureDriverExists(id);
    await this.validateUpdateBusinessRules(id, dto);

    return this.prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          middleName: dto.middleName,
          firstLastname: dto.firstLastname,
          secondLastname: dto.secondLastname,
          phone: dto.phone,
          email: dto.email,
          status: dto.status,
        },
      });

      if (dto.document) {
        const existingLink = await tx.personDocumentLink.findFirst({
          where: { personId: id },
          orderBy: { id: "asc" },
          select: { personDocumentId: true },
        });

        if (!existingLink) {
          throw new BadRequestException({
            success: false,
            message: "No se pudo actualizar el conductor",
            errors: ["El conductor no tiene documento asociado para actualizar"],
          });
        }

        const currentDocument = await tx.personDocument.findUnique({
          where: { id: existingLink.personDocumentId },
          select: { documentTypeId: true },
        });

        if (!currentDocument) {
          throw new BadRequestException({
            success: false,
            message: "No se pudo actualizar el conductor",
            errors: ["El documento asociado del conductor no existe"],
          });
        }

        const documentTypeId = dto.document.documentType
          ? await this.resolveDocumentTypeId(dto.document.documentType)
          : currentDocument.documentTypeId;

        await tx.personDocument.update({
          where: { id: existingLink.personDocumentId },
          data: {
            documentTypeId,
            documentNumber: dto.document.documentNumber,
            description: dto.document.description,
            status: "ACTIVE",
          },
        });

        if (dto.document.documentRole) {
          await tx.personDocumentLink.updateMany({
            where: {
              personId: id,
              personDocumentId: existingLink.personDocumentId,
            },
            data: {
              documentRole: dto.document.documentRole,
            },
          });
        }
      }

      return this.findOneByIdInternal(tx, id);
    });
  }

  async inactivate(id: number) {
    const current = await this.ensureDriverExists(id);

    if (current.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar el conductor",
        errors: ["El conductor ya se encuentra inactivo"],
      });
    }

    return this.prisma.person.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: this.driverSelect,
    });
  }

  private async validateCreateBusinessRules(dto: CreateDriverDto) {
    const errors: string[] = [];

    if (dto.email) {
      const duplicateEmail = await this.prisma.person.findFirst({
        where: { email: dto.email },
        select: { id: true },
      });
      if (duplicateEmail) {
        errors.push("Ya existe una persona con ese email");
      }
    }

    const duplicateDoc = await this.prisma.personDocument.findFirst({
      where: {
        documentType: {
          name: {
            equals: dto.document.documentType,
            mode: "insensitive",
          },
        },
        documentNumber: dto.document.documentNumber,
      },
      select: { id: true },
    });
    if (duplicateDoc) {
      errors.push("Ya existe un documento con ese tipo y numero");
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar el conductor",
        errors,
      });
    }
  }

  private async validateUpdateBusinessRules(id: number, dto: UpdateDriverDto) {
    const errors: string[] = [];

    if (dto.email) {
      const duplicateEmail = await this.prisma.person.findFirst({
        where: {
          email: dto.email,
          id: { not: id },
        },
        select: { id: true },
      });
      if (duplicateEmail) {
        errors.push("Ya existe una persona con ese email");
      }
    }

    if (dto.document?.documentType || dto.document?.documentNumber) {
      if (!dto.document?.documentType || !dto.document?.documentNumber) {
        errors.push(
          "Para actualizar documento debes enviar documentType y documentNumber",
        );
      } else {
        const duplicateDoc = await this.prisma.personDocument.findFirst({
          where: {
            documentType: {
              name: {
                equals: dto.document.documentType,
                mode: "insensitive",
              },
            },
            documentNumber: dto.document.documentNumber,
            personDocumentLinks: {
              none: { personId: id },
            },
          },
          select: { id: true },
        });
        if (duplicateDoc) {
          errors.push("Ya existe un documento con ese tipo y numero");
        }
      }
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar el conductor",
        errors,
      });
    }
  }

  private async ensureDriverExists(id: number) {
    const driver = await this.prisma.person.findFirst({
      where: {
        id,
        personType: "DRIVER",
      },
      select: { id: true, status: true },
    });

    if (!driver) {
      throw new NotFoundException({
        success: false,
        message: "Conductor no encontrado",
      });
    }

    return driver;
  }

  private findOneByIdInternal(tx: Prisma.TransactionClient, id: number) {
    return tx.person.findFirst({
      where: {
        id,
        personType: "DRIVER",
      },
      select: this.driverSelect,
    });
  }

  private async resolveDocumentTypeId(documentTypeName: string) {
    const normalizedInput = documentTypeName.trim().toUpperCase();
    const aliasToCatalog: Record<string, string> = {
      CC: "Cedula de ciudadania",
      CEDULA: "Cedula de ciudadania",
      CEDULA_DE_CIUDADANIA: "Cedula de ciudadania",
      "CEDULA DE CIUDADANIA": "Cedula de ciudadania",
      TI: "Tarjeta de identidad",
      TARJETA_IDENTIDAD: "Tarjeta de identidad",
      "TARJETA DE IDENTIDAD": "Tarjeta de identidad",
      LICENCIA: "Licencia de conduccion",
      LICENCIA_CONDUCCION: "Licencia de conduccion",
      "LICENCIA DE CONDUCCION": "Licencia de conduccion",
      CE: "Cedula de extranjeria",
      CEDULA_EXTRANJERIA: "Cedula de extranjeria",
      "CEDULA DE EXTRANJERIA": "Cedula de extranjeria",
      PASAPORTE: "Pasaporte",
    };

    const targetName = aliasToCatalog[normalizedInput] ?? documentTypeName.trim();

    const documentType = await this.prisma.documentType.findFirst({
      where: {
        name: {
          equals: targetName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!documentType) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo procesar el documento",
        errors: [
          `El tipo de documento '${documentTypeName}' no existe en el catalogo DOCUMENT_TYPE`,
        ],
      });
    }

    return documentType.id;
  }
}
