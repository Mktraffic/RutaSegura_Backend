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

  private readonly defaultAlertDaysAhead = 30;

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

    const created = await this.prisma.$transaction(async (tx) => {
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

    if (created) {
      await this.refreshPersonDocumentAlerts(created.id);
    }

    return created;
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

    const updated = await this.prisma.personDocument.update({
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

    await this.refreshPersonDocumentAlerts(updated.id);

    return updated;
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

    const updated = await this.prisma.personDocument.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: this.personDocumentSelect,
    });

    await this.refreshPersonDocumentAlerts(updated.id);

    return updated;
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

    const created = await this.prisma.$transaction(async (tx) => {
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

    if (created) {
      await this.refreshVehicleDocumentAlerts(created.id);
    }

    return created;
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

    const updated = await this.prisma.vehicleDocument.update({
      where: { id },
      data: {
        documentNumber: dto.documentNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        fileUrl: dto.fileUrl,
        status: dto.status,
      },
    });

    await this.refreshVehicleDocumentAlerts(updated.id);

    return updated;
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

    const updated = await this.prisma.vehicleDocument.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    await this.refreshVehicleDocumentAlerts(updated.id);

    return updated;
  }

  async generateExpiryAlerts(daysAhead = this.defaultAlertDaysAhead) {
    const summary = await this.syncExpiryAlerts(daysAhead);
    return {
      ...summary,
      daysAhead,
    };
  }

  async findAlerts(filters: AlertQueryDto) {
    const syncDaysAhead = filters.daysAhead
      ? Math.max(filters.daysAhead, this.defaultAlertDaysAhead)
      : this.defaultAlertDaysAhead;

    await this.syncExpiryAlerts(syncDaysAhead);

    const where = this.buildAlertWhere(filters);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [totalItems, alerts] = await this.prisma.$transaction([
      this.prisma.documentAlert.count({ where }),
      this.prisma.documentAlert.findMany({
        where,
        orderBy: [{ isRead: "asc" }, { generatedAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const items = alerts.map((alert) => this.decorateAlert(alert));

    return {
      items,
      meta: {
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        page,
        limit,
      },
    };
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

  private decorateAlert(alert: {
    alertType: string | null;
    daysRemaining: number | null;
    isRead: boolean;
    [key: string]: unknown;
  }) {
    return {
      ...alert,
      classification: this.classifyAlert(alert),
      readState: alert.isRead ? "READ" : "UNREAD",
    };
  }

  private classifyAlert(alert: {
    alertType: string | null;
    daysRemaining: number | null;
  }) {
    if (alert.alertType === "EXPIRED" || (alert.daysRemaining ?? 0) < 0) {
      return "EXPIRED";
    }

    if (alert.alertType === "EXPIRY_WARNING") {
      return "EXPIRING_SOON";
    }

    return "UPCOMING";
  }

  private resolveVehicleDocumentLabel(documentType: string) {
    const normalized = documentType.trim().toUpperCase();
    const mapping: Record<string, string> = {
      SOAT: "SOAT",
      TECHNICAL_INSPECTION: "TECNOMECÁNICA",
      INSURANCE: "SEGURO",
      PROPERTY_CARD: "TARJETA DE PROPIEDAD",
    };

    return mapping[normalized] ?? documentType;
  }

  private buildDocumentAlertMessage(
    scope: "person" | "vehicle",
    documentLabel: string,
    daysRemaining: number,
  ) {
    const absoluteDays = Math.abs(daysRemaining);
    const normalizedLabel =
      scope === "vehicle" ? this.resolveVehicleDocumentLabel(documentLabel) : documentLabel;

    if (daysRemaining < 0) {
      return scope === "person"
        ? `Documento de persona ${normalizedLabel} vencido hace ${absoluteDays} dias`
        : `Documento vehicular ${normalizedLabel} vencido hace ${absoluteDays} dias`;
    }

    return scope === "person"
      ? `Documento de persona ${normalizedLabel} vence en ${daysRemaining} dias`
      : `Documento vehicular ${normalizedLabel} vence en ${daysRemaining} dias`;
  }

  private resolveAlertType(daysRemaining: number, daysAhead: number) {
    if (daysRemaining < 0) {
      return "EXPIRED" as const;
    }

    if (daysRemaining <= daysAhead) {
      return "EXPIRY_WARNING" as const;
    }

    return null;
  }

  private calculateDaysRemaining(today: Date, expiryDate: Date) {
    return Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  private isVehicleDocumentAlertable(documentType: string | null | undefined) {
    if (!documentType) return false;
    return documentType.trim().toUpperCase() !== "PROPERTY_CARD";
  }

  private async upsertPersonDocumentAlert(payload: {
    alertType: "EXPIRY_WARNING" | "EXPIRY_INFO" | "EXPIRED";
    personDocumentId: number;
    personId: number;
    documentExpiryDate: Date;
    daysRemaining: number;
    message: string;
  }) {
    const existing = await this.prisma.documentAlert.findFirst({
      where: {
        personDocumentId: payload.personDocumentId,
        personId: payload.personId,
      },
      select: { id: true, alertType: true },
    });

    if (existing) {
      const shouldResetRead = existing.alertType !== payload.alertType;
      await this.prisma.documentAlert.update({
        where: { id: existing.id },
        data: {
          alertType: payload.alertType,
          message: payload.message,
          documentExpiryDate: payload.documentExpiryDate,
          daysRemaining: payload.daysRemaining,
          ...(shouldResetRead
            ? {
                isRead: false,
                readAt: null,
                generatedAt: new Date(),
              }
            : {}),
        },
      });

      await this.prisma.documentAlert.deleteMany({
        where: {
          personDocumentId: payload.personDocumentId,
          personId: payload.personId,
          id: { not: existing.id },
        },
      });

      return { created: false, updated: true };
    }

    await this.prisma.documentAlert.create({
      data: {
        ...payload,
        isRead: false,
      },
    });

    return { created: true, updated: false };
  }

  private async upsertVehicleDocumentAlert(payload: {
    alertType: "EXPIRY_WARNING" | "EXPIRY_INFO" | "EXPIRED";
    vehicleDocumentId: number;
    vehiclePlate: string;
    documentExpiryDate: Date;
    daysRemaining: number;
    message: string;
  }) {
    const existing = await this.prisma.documentAlert.findFirst({
      where: {
        vehicleDocumentId: payload.vehicleDocumentId,
        vehiclePlate: payload.vehiclePlate,
      },
      select: { id: true, alertType: true },
    });

    if (existing) {
      const shouldResetRead = existing.alertType !== payload.alertType;
      await this.prisma.documentAlert.update({
        where: { id: existing.id },
        data: {
          alertType: payload.alertType,
          message: payload.message,
          documentExpiryDate: payload.documentExpiryDate,
          daysRemaining: payload.daysRemaining,
          ...(shouldResetRead
            ? {
                isRead: false,
                readAt: null,
                generatedAt: new Date(),
              }
            : {}),
        },
      });

      await this.prisma.documentAlert.deleteMany({
        where: {
          vehicleDocumentId: payload.vehicleDocumentId,
          vehiclePlate: payload.vehiclePlate,
          id: { not: existing.id },
        },
      });

      return { created: false, updated: true };
    }

    await this.prisma.documentAlert.create({
      data: {
        ...payload,
        isRead: false,
      },
    });

    return { created: true, updated: false };
  }

  private async clearPersonDocumentAlerts(
    documentId: number,
    keepPersonIds?: number[],
  ) {
    if (keepPersonIds && keepPersonIds.length > 0) {
      const removed = await this.prisma.documentAlert.deleteMany({
        where: {
          personDocumentId: documentId,
          personId: { notIn: keepPersonIds },
        },
      });
      return removed.count;
    }

    const removed = await this.prisma.documentAlert.deleteMany({
      where: {
        personDocumentId: documentId,
      },
    });
    return removed.count;
  }

  private async clearVehicleDocumentAlerts(documentId: number) {
    const removed = await this.prisma.documentAlert.deleteMany({
      where: {
        vehicleDocumentId: documentId,
      },
    });
    return removed.count;
  }

  private async refreshPersonDocumentAlerts(
    documentId: number,
    daysAhead = this.defaultAlertDaysAhead,
  ) {
    const doc = await this.prisma.personDocument.findUnique({
      where: { id: documentId },
      include: {
        personDocumentLinks: {
          select: {
            personId: true,
          },
        },
      },
    });

    if (!doc) return;

    if (doc.status?.toUpperCase() === "INACTIVE" || !doc.expiryDate) {
      await this.clearPersonDocumentAlerts(documentId);
      return;
    }

    if (doc.personDocumentLinks.length === 0) {
      await this.clearPersonDocumentAlerts(documentId);
      return;
    }

    const daysRemaining = this.calculateDaysRemaining(new Date(), doc.expiryDate);
    const alertType = this.resolveAlertType(daysRemaining, daysAhead);

    if (!alertType) {
      await this.clearPersonDocumentAlerts(documentId);
      return;
    }

    for (const link of doc.personDocumentLinks) {
      await this.upsertPersonDocumentAlert({
        alertType,
        personDocumentId: doc.id,
        personId: link.personId,
        documentExpiryDate: doc.expiryDate,
        daysRemaining,
        message: this.buildDocumentAlertMessage("person", doc.documentNumber, daysRemaining),
      });
    }

    const personIds = doc.personDocumentLinks.map((link) => link.personId);
    await this.clearPersonDocumentAlerts(doc.id, personIds);
  }

  private async refreshVehicleDocumentAlerts(
    documentId: number,
    daysAhead = this.defaultAlertDaysAhead,
  ) {
    const doc = await this.prisma.vehicleDocument.findUnique({
      where: { id: documentId },
      include: {
        vehicleAsSoat: { select: { plate: true } },
        vehicleAsTechnicalInspection: { select: { plate: true } },
        vehicleAsInsurance: { select: { plate: true } },
        vehicleAsPropertyCard: { select: { plate: true } },
      },
    });

    if (!doc) return;

    if (
      doc.status?.toUpperCase() === "INACTIVE" ||
      !doc.expiryDate ||
      !this.isVehicleDocumentAlertable(doc.documentType)
    ) {
      await this.clearVehicleDocumentAlerts(documentId);
      return;
    }

    const vehiclePlate =
      doc.vehicleAsSoat?.plate ??
      doc.vehicleAsTechnicalInspection?.plate ??
      doc.vehicleAsInsurance?.plate ??
      doc.vehicleAsPropertyCard?.plate;

    if (!vehiclePlate) {
      await this.clearVehicleDocumentAlerts(documentId);
      return;
    }

    const daysRemaining = this.calculateDaysRemaining(new Date(), doc.expiryDate);
    const alertType = this.resolveAlertType(daysRemaining, daysAhead);

    if (!alertType) {
      await this.clearVehicleDocumentAlerts(documentId);
      return;
    }

    await this.upsertVehicleDocumentAlert({
      alertType,
      vehicleDocumentId: doc.id,
      vehiclePlate,
      documentExpiryDate: doc.expiryDate,
      daysRemaining,
      message: this.buildDocumentAlertMessage("vehicle", doc.documentType, daysRemaining),
    });
  }

  private async syncExpiryAlerts(daysAhead: number) {
    const today = new Date();
    let created = 0;
    let updated = 0;
    let removed = 0;

    const clearedPerson = await this.prisma.documentAlert.deleteMany({
      where: {
        personDocumentId: { not: null },
        OR: [
          { personDocument: { status: "INACTIVE" } },
          { personDocument: { expiryDate: null } },
        ],
      },
    });
    removed += clearedPerson.count;

    const personDocs = await this.prisma.personDocument.findMany({
      where: {
        status: { not: "INACTIVE" },
        expiryDate: { not: null },
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
      if (!doc.expiryDate || doc.personDocumentLinks.length === 0) {
        removed += await this.clearPersonDocumentAlerts(doc.id);
        continue;
      }

      const daysRemaining = this.calculateDaysRemaining(today, doc.expiryDate);
      const alertType = this.resolveAlertType(daysRemaining, daysAhead);

      if (!alertType) {
        removed += await this.clearPersonDocumentAlerts(doc.id);
        continue;
      }

      for (const link of doc.personDocumentLinks) {
        const result = await this.upsertPersonDocumentAlert({
          alertType,
          personDocumentId: doc.id,
          personId: link.personId,
          documentExpiryDate: doc.expiryDate,
          daysRemaining,
          message: this.buildDocumentAlertMessage("person", doc.documentNumber, daysRemaining),
        });

        if (result.created) created += 1;
        if (result.updated) updated += 1;
      }

      const personIds = doc.personDocumentLinks.map((link) => link.personId);
      removed += await this.clearPersonDocumentAlerts(doc.id, personIds);
    }

    const clearedVehicle = await this.prisma.documentAlert.deleteMany({
      where: {
        vehicleDocumentId: { not: null },
        OR: [
          { vehicleDocument: { status: "INACTIVE" } },
          { vehicleDocument: { expiryDate: null } },
          { vehicleDocument: { documentType: "PROPERTY_CARD" } },
        ],
      },
    });
    removed += clearedVehicle.count;

    const vehicleDocs = await this.prisma.vehicleDocument.findMany({
      where: {
        status: { not: "INACTIVE" },
        expiryDate: { not: null },
        documentType: { not: "PROPERTY_CARD" },
      },
      include: {
        vehicleAsSoat: { select: { plate: true } },
        vehicleAsTechnicalInspection: { select: { plate: true } },
        vehicleAsInsurance: { select: { plate: true } },
        vehicleAsPropertyCard: { select: { plate: true } },
      },
    });

    for (const doc of vehicleDocs) {
      if (!doc.expiryDate || !this.isVehicleDocumentAlertable(doc.documentType)) {
        removed += await this.clearVehicleDocumentAlerts(doc.id);
        continue;
      }

      const vehiclePlate =
        doc.vehicleAsSoat?.plate ??
        doc.vehicleAsTechnicalInspection?.plate ??
        doc.vehicleAsInsurance?.plate ??
        doc.vehicleAsPropertyCard?.plate;

      if (!vehiclePlate) {
        removed += await this.clearVehicleDocumentAlerts(doc.id);
        continue;
      }

      const daysRemaining = this.calculateDaysRemaining(today, doc.expiryDate);
      const alertType = this.resolveAlertType(daysRemaining, daysAhead);

      if (!alertType) {
        removed += await this.clearVehicleDocumentAlerts(doc.id);
        continue;
      }

      const result = await this.upsertVehicleDocumentAlert({
        alertType,
        vehicleDocumentId: doc.id,
        vehiclePlate,
        documentExpiryDate: doc.expiryDate,
        daysRemaining,
        message: this.buildDocumentAlertMessage("vehicle", doc.documentType, daysRemaining),
      });

      if (result.created) created += 1;
      if (result.updated) updated += 1;
    }

    return {
      created,
      updated,
      removed,
    };
  }

  private buildAlertWhere(filters: AlertQueryDto): Prisma.DocumentAlertWhereInput {
    return {
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
      ...(filters.alertType ? { alertType: filters.alertType } : {}),
      ...(filters.q
        ? {
            OR: [
              { message: { contains: filters.q, mode: "insensitive" } },
              { alertType: { contains: filters.q, mode: "insensitive" } },
              { vehiclePlate: { contains: filters.q, mode: "insensitive" } },
              {
                personDocument: {
                  documentNumber: { contains: filters.q, mode: "insensitive" },
                },
              },
              {
                vehicleDocument: {
                  documentNumber: { contains: filters.q, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };
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
    void documentTypeId;

    const duplicate = await this.prisma.personDocument.findFirst({
      where: {
        documentNumber,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException({
        success: false,
        message: "No pudimos guardar el documento de la persona",
        errors: ["Ya existe una persona con ese numero de documento"],
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
