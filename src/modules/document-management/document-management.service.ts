import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AlertQueryDto,
  CreateDocumentTypeDto,
  CreatePersonDocumentDto,
  CreateVehicleDocumentDto,
  UpdateDocumentTypeDto,
  UpdatePersonDocumentDto,
  UpdateVehicleDocumentDto,
} from "./dto/document-management.dto";

@Injectable()
export class DocumentManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async findDocumentTypes(query?: string) {
    return this.prisma.documentType.findMany({
      where: query
        ? {
            name: { contains: query, mode: "insensitive" },
          }
        : undefined,
      orderBy: { name: "asc" },
    });
  }

  async createDocumentType(dto: CreateDocumentTypeDto) {
    const existing = await this.prisma.documentType.findFirst({
      where: {
        name: {
          equals: dto.name.trim(),
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el tipo de documento",
        errors: ["Ya existe un tipo de documento con ese nombre"],
      });
    }

    return this.prisma.documentType.create({
      data: {
        name: dto.name.trim(),
      },
    });
  }

  async updateDocumentType(id: number, dto: UpdateDocumentTypeDto) {
    await this.ensureDocumentTypeExists(id);

    if (dto.name) {
      const existing = await this.prisma.documentType.findFirst({
        where: {
          id: { not: id },
          name: {
            equals: dto.name.trim(),
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (existing) {
        throw new BadRequestException({
          success: false,
          message: "No se pudo actualizar el tipo de documento",
          errors: ["Ya existe un tipo de documento con ese nombre"],
        });
      }
    }

    return this.prisma.documentType.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
      },
    });
  }

  async createPersonDocument(dto: CreatePersonDocumentDto) {
    await this.ensurePersonExists(dto.personId);

    const documentTypeId = await this.resolveDocumentTypeId(dto.documentType);
    await this.ensurePersonDocumentUnique(documentTypeId, dto.documentNumber);

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.personDocument.create({
        data: {
          documentTypeId,
          documentNumber: dto.documentNumber,
          description: dto.description,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          fileUrl: dto.fileUrl,
          status: "ACTIVE",
        },
      });

      await tx.personDocumentLink.create({
        data: {
          personId: dto.personId,
          personDocumentId: document.id,
          documentRole: dto.documentRole ?? "PRIMARY",
        },
      });

      return tx.personDocument.findUnique({
        where: { id: document.id },
        select: this.personDocumentSelect,
      });
    });
  }

  async findPersonDocuments(query?: string) {
    return this.prisma.personDocument.findMany({
      where: query
        ? {
            OR: [
              { documentNumber: { contains: query, mode: "insensitive" } },
              {
                documentType: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
              {
                personDocumentLinks: {
                  some: {
                    person: {
                      OR: [
                        { firstName: { contains: query, mode: "insensitive" } },
                        { firstLastname: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : undefined,
      orderBy: { id: "desc" },
      select: this.personDocumentSelect,
    });
  }

  async updatePersonDocument(id: number, dto: UpdatePersonDocumentDto) {
    const current = await this.ensurePersonDocumentExists(id);

    const nextDocumentTypeId = dto.documentType
      ? await this.resolveDocumentTypeId(dto.documentType)
      : current.documentTypeId;

    if (dto.documentNumber || dto.documentType) {
      await this.ensurePersonDocumentUnique(
        nextDocumentTypeId,
        dto.documentNumber ?? current.documentNumber,
        id,
      );
    }

    return this.prisma.personDocument.update({
      where: { id },
      data: {
        documentTypeId: nextDocumentTypeId,
        documentNumber: dto.documentNumber,
        description: dto.description,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        fileUrl: dto.fileUrl,
        status: dto.status,
      },
      select: this.personDocumentSelect,
    });
  }

  async inactivatePersonDocument(id: number) {
    const current = await this.ensurePersonDocumentExists(id);

    if (current.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar el documento de persona",
        errors: ["El documento de persona ya se encuentra inactivo"],
      });
    }

    return this.prisma.personDocument.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: this.personDocumentSelect,
    });
  }

  async createVehicleDocument(dto: CreateVehicleDocumentDto) {
    const vehicle = await this.ensureVehicleExists(dto.vehiclePlate);

    if (vehicle.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el documento de vehiculo",
        errors: ["No se pueden asociar documentos a un vehiculo inactivo"],
      });
    }

    await this.ensureVehicleDocumentUnique(dto.documentType, dto.documentNumber);

    return this.prisma.$transaction(async (tx) => {
      const document = await tx.vehicleDocument.create({
        data: {
          documentType: dto.documentType,
          documentNumber: dto.documentNumber,
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          fileUrl: dto.fileUrl,
          status: "ACTIVE",
        },
      });

      const updateData: Prisma.VehicleUpdateInput = {};
      if (dto.documentType === "SOAT") updateData.soat = { connect: { id: document.id } };
      if (dto.documentType === "TECHNICAL_INSPECTION") {
        updateData.technicalInspection = { connect: { id: document.id } };
      }
      if (dto.documentType === "INSURANCE") {
        updateData.insurance = { connect: { id: document.id } };
      }
      if (dto.documentType === "PROPERTY_CARD") {
        updateData.propertyCard = { connect: { id: document.id } };
      }

      await tx.vehicle.update({
        where: { plate: vehicle.plate },
        data: updateData,
      });

      return tx.vehicleDocument.findUnique({
        where: { id: document.id },
      });
    });
  }

  async findVehicleDocuments(query?: string) {
    return this.prisma.vehicleDocument.findMany({
      where: query
        ? {
            OR: [
              { documentType: { contains: query, mode: "insensitive" } },
              { documentNumber: { contains: query, mode: "insensitive" } },
              { vehicleAsSoat: { plate: { contains: query, mode: "insensitive" } } },
              {
                vehicleAsTechnicalInspection: {
                  plate: { contains: query, mode: "insensitive" },
                },
              },
              { vehicleAsInsurance: { plate: { contains: query, mode: "insensitive" } } },
              {
                vehicleAsPropertyCard: {
                  plate: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : undefined,
      orderBy: { id: "desc" },
    });
  }

  async updateVehicleDocument(id: number, dto: UpdateVehicleDocumentDto) {
    const current = await this.ensureVehicleDocumentExists(id);
    if (dto.documentNumber) {
      await this.ensureVehicleDocumentUnique(
        current.documentType as
          | "SOAT"
          | "TECHNICAL_INSPECTION"
          | "INSURANCE"
          | "PROPERTY_CARD",
        dto.documentNumber,
        id,
      );
    }

    return this.prisma.vehicleDocument.update({
      where: { id },
      data: {
        documentNumber: dto.documentNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        fileUrl: dto.fileUrl,
        status: dto.status,
      },
    });
  }

  async inactivateVehicleDocument(id: number) {
    const current = await this.ensureVehicleDocumentExists(id);

    if (current.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar el documento de vehiculo",
        errors: ["El documento de vehiculo ya se encuentra inactivo"],
      });
    }

    return this.prisma.vehicleDocument.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
  }

  async generateExpiryAlerts(daysAhead = 30) {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);

    let created = 0;

    const personDocs = await this.prisma.personDocument.findMany({
      where: {
        status: { not: "INACTIVE" },
        expiryDate: {
          gte: today,
          lte: endDate,
        },
      },
      include: {
        personDocumentLinks: {
          select: {
            personId: true,
          },
        },
      },
    });

    for (const doc of personDocs) {
      for (const link of doc.personDocumentLinks) {
        const exists = await this.prisma.documentAlert.findFirst({
          where: {
            personDocumentId: doc.id,
            personId: link.personId,
            isRead: false,
          },
          select: { id: true },
        });

        if (!exists && doc.expiryDate) {
          const daysRemaining = Math.ceil(
            (doc.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );

          await this.prisma.documentAlert.create({
            data: {
              personDocumentId: doc.id,
              personId: link.personId,
              alertType: "EXPIRY_WARNING",
              message: `Documento de persona vence en ${daysRemaining} dias`,
              documentExpiryDate: doc.expiryDate,
              daysRemaining,
              isRead: false,
            },
          });
          created += 1;
        }
      }
    }

    const vehicleDocs = await this.prisma.vehicleDocument.findMany({
      where: {
        status: { not: "INACTIVE" },
        expiryDate: {
          gte: today,
          lte: endDate,
        },
      },
      include: {
        vehicleAsSoat: { select: { plate: true } },
        vehicleAsTechnicalInspection: { select: { plate: true } },
        vehicleAsInsurance: { select: { plate: true } },
        vehicleAsPropertyCard: { select: { plate: true } },
      },
    });

    for (const doc of vehicleDocs) {
      const vehiclePlate =
        doc.vehicleAsSoat?.plate ??
        doc.vehicleAsTechnicalInspection?.plate ??
        doc.vehicleAsInsurance?.plate ??
        doc.vehicleAsPropertyCard?.plate;

      if (!vehiclePlate || !doc.expiryDate) continue;

      const exists = await this.prisma.documentAlert.findFirst({
        where: {
          vehicleDocumentId: doc.id,
          vehiclePlate,
          isRead: false,
        },
        select: { id: true },
      });

      if (exists) continue;

      const daysRemaining = Math.ceil(
        (doc.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.prisma.documentAlert.create({
        data: {
          vehicleDocumentId: doc.id,
          vehiclePlate,
          alertType: "EXPIRY_WARNING",
          message: `Documento vehicular ${doc.documentType} vence en ${daysRemaining} dias`,
          documentExpiryDate: doc.expiryDate,
          daysRemaining,
          isRead: false,
        },
      });
      created += 1;
    }

    return { created, daysAhead };
  }

  async findAlerts(filters: AlertQueryDto) {
    return this.prisma.documentAlert.findMany({
      where: {
        ...(typeof filters.isRead === "boolean" ? { isRead: filters.isRead } : {}),
        ...(filters.personId ? { personId: filters.personId } : {}),
        ...(filters.vehiclePlate
          ? { vehiclePlate: filters.vehiclePlate.trim().toUpperCase() }
          : {}),
        ...(filters.daysAhead
          ? {
              daysRemaining: {
                lte: filters.daysAhead,
              },
            }
          : {}),
        ...(filters.q
          ? {
              OR: [
                { message: { contains: filters.q, mode: "insensitive" } },
                { alertType: { contains: filters.q, mode: "insensitive" } },
                { vehiclePlate: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ isRead: "asc" }, { generatedAt: "desc" }],
    });
  }

  async markAlertAsRead(id: number) {
    const alert = await this.ensureAlertExists(id);

    if (alert.isRead) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar la alerta",
        errors: ["La alerta ya estaba marcada como leida"],
      });
    }

    return this.prisma.documentAlert.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  private readonly personDocumentSelect = {
    id: true,
    documentNumber: true,
    description: true,
    issueDate: true,
    expiryDate: true,
    fileUrl: true,
    status: true,
    createdAt: true,
    documentType: {
      select: {
        id: true,
        name: true,
      },
    },
    personDocumentLinks: {
      select: {
        id: true,
        documentRole: true,
        person: {
          select: {
            id: true,
            personType: true,
            firstName: true,
            firstLastname: true,
            email: true,
          },
        },
      },
    },
  } satisfies Prisma.PersonDocumentSelect;

  private async ensureDocumentTypeExists(id: number) {
    const item = await this.prisma.documentType.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException({ success: false, message: "Tipo de documento no encontrado" });
    }
    return item;
  }

  private async ensurePersonExists(id: number) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!person) {
      throw new NotFoundException({ success: false, message: "Persona no encontrada" });
    }
    return person;
  }

  private async ensureVehicleExists(plate: string) {
    const normalizedPlate = plate.trim().toUpperCase();
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: normalizedPlate },
      select: { plate: true, status: true },
    });
    if (!vehicle) {
      throw new NotFoundException({ success: false, message: "Vehiculo no encontrado" });
    }
    return vehicle;
  }

  private async ensurePersonDocumentExists(id: number) {
    const doc = await this.prisma.personDocument.findUnique({
      where: { id },
      select: { id: true, documentTypeId: true, documentNumber: true, status: true },
    });
    if (!doc) {
      throw new NotFoundException({ success: false, message: "Documento de persona no encontrado" });
    }
    return doc;
  }

  private async ensureVehicleDocumentExists(id: number) {
    const doc = await this.prisma.vehicleDocument.findUnique({
      where: { id },
      select: { id: true, documentType: true, status: true },
    });
    if (!doc) {
      throw new NotFoundException({ success: false, message: "Documento de vehiculo no encontrado" });
    }
    return doc;
  }

  private async ensureAlertExists(id: number) {
    const alert = await this.prisma.documentAlert.findUnique({
      where: { id },
      select: { id: true, isRead: true },
    });
    if (!alert) {
      throw new NotFoundException({ success: false, message: "Alerta no encontrada" });
    }
    return alert;
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

  private async ensurePersonDocumentUnique(
    documentTypeId: number,
    documentNumber: string,
    excludeId?: number,
  ) {
    const duplicate = await this.prisma.personDocument.findFirst({
      where: {
        documentTypeId,
        documentNumber,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException({
        success: false,
        message: "No pudimos guardar el documento de la persona",
        errors: ["Ya existe un documento de persona con ese tipo y numero"],
      });
    }
  }

  private async ensureVehicleDocumentUnique(
    documentType: "SOAT" | "TECHNICAL_INSPECTION" | "INSURANCE" | "PROPERTY_CARD",
    documentNumber: string,
    excludeId?: number,
  ) {
    const duplicate = await this.prisma.vehicleDocument.findFirst({
      where: {
        documentType,
        documentNumber,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException({
        success: false,
        message: "No pudimos guardar el documento del vehiculo",
        errors: ["Ya existe un documento vehicular con ese tipo y numero"],
      });
    }
  }
}
