import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDriverDto, UpdateDriverDto } from "./dto/driver.dto";

type DriverDocumentKind = "CC" | "LICENSE";
type DriverDocumentInput = {
  documentType: string;
  documentNumber?: string;
  description?: string;
  documentRole?: string;
};

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
    const documentsByKind = await this.validateCreateBusinessRules(dto);

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

      for (const [kind, doc] of documentsByKind.entries()) {
        const documentTypeId = await this.resolveDocumentTypeId(doc.documentType);
        const document = await tx.personDocument.create({
          data: {
            documentTypeId,
            documentNumber: doc.documentNumber!,
            description: doc.description,
            status: "ACTIVE",
          },
        });

        await tx.personDocumentLink.create({
          data: {
            personId: person.id,
            personDocumentId: document.id,
            documentRole: this.resolveDriverDocumentRole(kind, doc.documentRole),
          },
        });
      }

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
    const existingDocuments = await this.loadDriverDocumentsByKind(id);
    await this.validateUpdateBusinessRules(id, dto, existingDocuments);

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

      if (dto.documents?.length) {
        const documentsByKind = this.collectDriverDocuments(dto.documents).documentsByKind;
        const requiredKinds: DriverDocumentKind[] = ["CC", "LICENSE"];

        for (const kind of requiredKinds) {
          if (!documentsByKind.has(kind)) {
            throw new BadRequestException({
              success: false,
              message: "No se pudo actualizar el conductor",
              errors: ["Debes incluir la cedula y la licencia para actualizar documentos"],
            });
          }
        }

        for (const [kind, doc] of documentsByKind.entries()) {
          const existing = existingDocuments.get(kind);
          if (existing) {
            if (
              doc.documentNumber &&
              doc.documentNumber !== existing.documentNumber
            ) {
              throw new BadRequestException({
                success: false,
                message: "No se pudo actualizar el conductor",
                errors: [
                  `No puedes modificar el numero de ${this.describeKind(kind)}`,
                ],
              });
            }

            const documentTypeId = doc.documentType
              ? await this.resolveDocumentTypeId(doc.documentType)
              : existing.documentTypeId;

            await tx.personDocument.update({
              where: { id: existing.documentId },
              data: {
                documentTypeId,
                description: doc.description,
                status: "ACTIVE",
              },
            });

            if (doc.documentRole) {
              await tx.personDocumentLink.updateMany({
                where: {
                  personId: id,
                  personDocumentId: existing.documentId,
                },
                data: {
                  documentRole: this.resolveDriverDocumentRole(kind, doc.documentRole),
                },
              });
            }
          } else {
            if (!doc.documentNumber) {
              throw new BadRequestException({
                success: false,
                message: "No se pudo actualizar el conductor",
                errors: [
                  `Debes indicar el numero del documento para ${this.describeKind(kind)}`,
                ],
              });
            }

            const documentTypeId = await this.resolveDocumentTypeId(doc.documentType);
            const document = await tx.personDocument.create({
              data: {
                documentTypeId,
                documentNumber: doc.documentNumber,
                description: doc.description,
                status: "ACTIVE",
              },
              select: { id: true },
            });

            await tx.personDocumentLink.create({
              data: {
                personId: id,
                personDocumentId: document.id,
                documentRole: this.resolveDriverDocumentRole(kind, doc.documentRole),
              },
            });
          }
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

    const { documentsByKind, errors: documentErrors } = this.collectDriverDocuments(
      dto.documents,
    );
    errors.push(...documentErrors);

    const missingKinds = this.missingRequiredKinds(documentsByKind);
    if (missingKinds.includes("CC")) {
      errors.push("Falta el documento de cedula de ciudadania (CC)");
    }
    if (missingKinds.includes("LICENSE")) {
      errors.push("Falta el documento de licencia de conduccion");
    }

    for (const doc of documentsByKind.values()) {
      const duplicateDoc = await this.prisma.personDocument.findFirst({
        where: {
          documentNumber: doc.documentNumber,
        },
        select: { id: true },
      });
      if (duplicateDoc) {
        errors.push(
          `Ya existe una persona con el numero de ${this.describeKind(
            doc.kind,
          )}`,
        );
      }
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar el conductor",
        errors,
      });
    }

    return documentsByKind;
  }

  private async validateUpdateBusinessRules(
    id: number,
    dto: UpdateDriverDto,
    existingDocuments: Map<DriverDocumentKind, {
      documentId: number;
      documentTypeId: number;
      documentNumber: string;
    }>,
  ) {
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

    if (existingDocuments.size < 2 && !dto.documents?.length) {
      errors.push(
        "Este conductor necesita cedula y licencia para continuar. Completa los documentos.",
      );
    }

    if (dto.documents?.length) {
      const { documentsByKind, errors: documentErrors } = this.collectDriverDocuments(
        dto.documents,
      );
      errors.push(...documentErrors);

      const missingKinds = this.missingRequiredKinds(documentsByKind);
      if (missingKinds.length) {
        errors.push("Debes incluir cedula y licencia al actualizar documentos");
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
        message: "No pudimos guardar el documento",
        errors: [
          `El tipo de documento '${documentTypeName}' no existe`,
        ],
      });
    }

    return documentType.id;
  }

  private resolveDriverDocumentKind(input: string): DriverDocumentKind | "OTHER" {
    const normalized = input.trim().toUpperCase();
    const ccAliases = new Set([
      "CC",
      "CEDULA",
      "CEDULA_DE_CIUDADANIA",
      "CEDULA DE CIUDADANIA",
    ]);
    const licenseAliases = new Set([
      "LICENCIA",
      "LICENCIA_CONDUCCION",
      "LICENCIA DE CONDUCCION",
    ]);

    if (ccAliases.has(normalized)) return "CC";
    if (licenseAliases.has(normalized)) return "LICENSE";
    return "OTHER";
  }

  private describeKind(kind: DriverDocumentKind) {
    return kind === "CC" ? "la cedula" : "la licencia";
  }

  private resolveDriverDocumentRole(kind: DriverDocumentKind, value?: string) {
    if (value?.trim()) return value.trim();
    return kind === "CC" ? "DRIVER_ID" : "DRIVER_LICENSE";
  }

  private collectDriverDocuments(docs: DriverDocumentInput[]) {
    const documentsByKind = new Map<DriverDocumentKind, DriverDocumentInput & { kind: DriverDocumentKind }>();
    const errors: string[] = [];

    for (const doc of docs) {
      const kind = this.resolveDriverDocumentKind(doc.documentType);
      if (kind === "OTHER") {
        errors.push("Solo se permiten documentos de cedula y licencia para conductores");
        continue;
      }

      if (documentsByKind.has(kind)) {
        errors.push(`No puedes repetir ${this.describeKind(kind)} en el registro`);
        continue;
      }

      documentsByKind.set(kind, { ...doc, kind });
    }

    return { documentsByKind, errors };
  }

  private missingRequiredKinds(
    documentsByKind: Map<DriverDocumentKind, DriverDocumentInput & { kind: DriverDocumentKind }>,
  ) {
    const required: DriverDocumentKind[] = ["CC", "LICENSE"];
    return required.filter((kind) => !documentsByKind.has(kind));
  }

  private async loadDriverDocumentsByKind(id: number) {
    const links = await this.prisma.personDocumentLink.findMany({
      where: { personId: id },
      select: {
        personDocument: {
          select: {
            id: true,
            documentNumber: true,
            documentTypeId: true,
            documentType: { select: { name: true } },
          },
        },
      },
    });

    const map = new Map<DriverDocumentKind, {
      documentId: number;
      documentTypeId: number;
      documentNumber: string;
    }>();

    for (const link of links) {
      const doc = link.personDocument;
      if (!doc) continue;
      const kind = this.resolveDriverDocumentKind(doc.documentType.name);
      if (kind === "OTHER") continue;
      map.set(kind, {
        documentId: doc.id,
        documentTypeId: doc.documentTypeId,
        documentNumber: doc.documentNumber,
      });
    }

    return map;
  }
}
