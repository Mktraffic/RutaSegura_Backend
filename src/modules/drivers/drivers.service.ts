import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import {
  CreateDriverDto,
  DriverLicenseDto,
  UpdateDriverDto,
} from "./dto/driver.dto";

// Roles de documento que diferencian la cedula (identidad) de la licencia.
const IDENTITY_DOCUMENT_ROLE = "DRIVER_ID";
const LICENSE_DOCUMENT_ROLE = "DRIVER_LICENSE";

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
            issueDate: true,
            expiryDate: true,
            fileUrl: true,
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
    const licenseTypeId = dto.license
      ? await this.resolveDocumentTypeId("LICENCIA")
      : null;
    const licenseDates = dto.license
      ? this.resolveLicenseDates(dto.license)
      : null;

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
          documentRole: dto.document.documentRole ?? IDENTITY_DOCUMENT_ROLE,
        },
      });

      if (dto.license && licenseTypeId) {
        const license = await tx.personDocument.create({
          data: {
            documentTypeId: licenseTypeId,
            documentNumber: dto.license.documentNumber,
            description: dto.license.description,
            issueDate: licenseDates?.issueDate ?? undefined,
            expiryDate: licenseDates?.expiryDate ?? undefined,
            fileUrl: dto.license.fileKey,
            status: "ACTIVE",
          },
        });

        await tx.personDocumentLink.create({
          data: {
            personId: person.id,
            personDocumentId: license.id,
            documentRole: LICENSE_DOCUMENT_ROLE,
          },
        });
      }

      return this.findOneByIdInternal(tx, person.id);
    });
  }

  /**
   * Crea o reemplaza la licencia de conduccion del conductor.
   * Si se reemplaza la foto, borra el objeto anterior en R2 (best-effort).
   */
  async upsertLicense(personId: number, dto: DriverLicenseDto) {
    await this.ensureDriverExists(personId);

    // El numero de documento es unico a nivel global de PERSON_DOCUMENT.
    const duplicate = await this.prisma.personDocument.findFirst({
      where: {
        documentNumber: dto.documentNumber,
        personDocumentLinks: {
          none: {
            personId,
            documentRole: LICENSE_DOCUMENT_ROLE,
          },
        },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo guardar la licencia",
        errors: ["Ya existe un documento con ese numero de licencia"],
      });
    }

    const licenseTypeId = await this.resolveDocumentTypeId("LICENCIA");
    const { issueDate, expiryDate } = this.resolveLicenseDates(dto);

    const existingLink = await this.prisma.personDocumentLink.findFirst({
      where: { personId, documentRole: LICENSE_DOCUMENT_ROLE },
      select: {
        personDocumentId: true,
        personDocument: { select: { fileUrl: true } },
      },
    });

    if (existingLink) {
      const previousKey = existingLink.personDocument.fileUrl;
      await this.prisma.personDocument.update({
        where: { id: existingLink.personDocumentId },
        data: {
          documentTypeId: licenseTypeId,
          documentNumber: dto.documentNumber,
          description: dto.description,
          issueDate,
          expiryDate,
          ...(dto.fileKey !== undefined ? { fileUrl: dto.fileKey } : {}),
          status: "ACTIVE",
        },
      });

      // Borra la foto anterior solo si llega una nueva distinta.
      if (dto.fileKey && previousKey && previousKey !== dto.fileKey) {
        await this.storage.deleteObject(previousKey);
      }
    } else {
      await this.prisma.$transaction(async (tx) => {
        const license = await tx.personDocument.create({
          data: {
            documentTypeId: licenseTypeId,
            documentNumber: dto.documentNumber,
            description: dto.description,
            issueDate: issueDate ?? undefined,
            expiryDate: expiryDate ?? undefined,
            fileUrl: dto.fileKey,
            status: "ACTIVE",
          },
        });
        await tx.personDocumentLink.create({
          data: {
            personId,
            personDocumentId: license.id,
            documentRole: LICENSE_DOCUMENT_ROLE,
          },
        });
      });
    }

    return this.findOne(personId);
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
          where: { personId: id, documentRole: { not: LICENSE_DOCUMENT_ROLE } },
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
        documentNumber: dto.document.documentNumber,
      },
      select: { id: true },
    });
    if (duplicateDoc) {
      errors.push("Ya existe una persona con ese numero de documento");
    }

    if (dto.license) {
      if (dto.license.documentNumber === dto.document.documentNumber) {
        errors.push(
          "El numero de licencia no puede ser igual al del documento de identidad",
        );
      } else {
        const duplicateLicense = await this.prisma.personDocument.findFirst({
          where: { documentNumber: dto.license.documentNumber },
          select: { id: true },
        });
        if (duplicateLicense) {
          errors.push("Ya existe un documento con ese numero de licencia");
        }
      }
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

    if (dto.document && dto.document.documentNumber) {
      // Obtener el documento de identidad actual del conductor (no la licencia)
      const existingLink = await this.prisma.personDocumentLink.findFirst({
        where: { personId: id, documentRole: { not: LICENSE_DOCUMENT_ROLE } },
        orderBy: { id: "asc" },
        select: { personDocumentId: true },
      });

      if (existingLink) {
        const currentDocument = await this.prisma.personDocument.findUnique({
          where: { id: existingLink.personDocumentId },
          select: { documentNumber: true },
        });

        // Solo rechazar si el documentNumber cambió
        if (
          currentDocument &&
          currentDocument.documentNumber !== dto.document.documentNumber
        ) {
          errors.push(
            "No puedes modificar el numero de documento desde la edicion de conductor",
          );
        }
      }
    }

    if (dto.document && dto.document.documentType) {
      await this.resolveDocumentTypeId(dto.document.documentType);
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

  // La licencia de servicio público vence 3 años después de la expedición.
  // Si llega issueDate, el vencimiento se calcula; si no, se usa expiryDate.
  private resolveLicenseDates(dto: DriverLicenseDto): {
    issueDate: Date | null;
    expiryDate: Date | null;
  } {
    if (dto.issueDate) {
      const issue = new Date(dto.issueDate);
      const expiry = new Date(
        Date.UTC(
          issue.getUTCFullYear() + 3,
          issue.getUTCMonth(),
          issue.getUTCDate(),
        ),
      );
      return { issueDate: issue, expiryDate: expiry };
    }
    return {
      issueDate: null,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
    };
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
        message: "No pudimos guardar el documento",
        errors: [
          `El tipo de documento '${documentTypeName}' no existe`,
        ],
      });
    }

    return documentType.id;
  }
}
