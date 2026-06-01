import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateVehicleDto, UpdateVehicleDto } from "./dto/vehicle.dto";

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private readonly vehicleSelect = {
    plate: true,
    passengerCapacity: true,
    brand: true,
    model: true,
    year: true,
    status: true,
    createdAt: true,
    soat: {
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        issueDate: true,
        expiryDate: true,
        fileUrl: true,
        status: true,
      },
    },
    technicalInspection: {
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        issueDate: true,
        expiryDate: true,
        fileUrl: true,
        status: true,
      },
    },
    insurance: {
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        issueDate: true,
        expiryDate: true,
        fileUrl: true,
        status: true,
      },
    },
    propertyCard: {
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        issueDate: true,
        expiryDate: true,
        fileUrl: true,
        status: true,
      },
    },
  } satisfies Prisma.VehicleSelect;

  async create(dto: CreateVehicleDto) {
    await this.validateCreateBusinessRules(dto);

    return this.prisma.$transaction(async (tx) => {
      const soat = await this.createVehicleDocument(tx, "SOAT", dto.documents.soat);
      const technicalInspection = await this.createVehicleDocument(
        tx,
        "TECHNICAL_INSPECTION",
        dto.documents.technicalInspection,
      );
      const insurance = await this.createVehicleDocument(
        tx,
        "INSURANCE",
        dto.documents.insurance,
      );
      const propertyCard = await this.createVehicleDocument(
        tx,
        "PROPERTY_CARD",
        dto.documents.propertyCard,
      );

      return tx.vehicle.create({
        data: {
          plate: dto.plate.trim().toUpperCase(),
          passengerCapacity: dto.passengerCapacity,
          brand: dto.brand,
          model: dto.model,
          year: dto.year,
          status: "ACTIVE",
          soatId: soat.id,
          technicalInspectionId: technicalInspection.id,
          insuranceId: insurance.id,
          propertyCardId: propertyCard.id,
        },
        select: this.vehicleSelect,
      });
    });
  }

  async findAll(query?: string) {
    return this.prisma.vehicle.findMany({
      where: query
        ? {
            OR: [
              { plate: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
              { model: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { plate: "asc" },
      select: this.vehicleSelect,
    });
  }

  async findOne(plate: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: plate.trim().toUpperCase() },
      select: this.vehicleSelect,
    });

    if (!vehicle) {
      throw new NotFoundException({
        success: false,
        message: "Vehiculo no encontrado",
      });
    }

    return vehicle;
  }

  async update(plate: string, dto: UpdateVehicleDto) {
    const normalizedPlate = plate.trim().toUpperCase();
    const current = await this.ensureVehicleExists(normalizedPlate);
    await this.validateUpdateBusinessRules(dto, current);

    return this.prisma.$transaction(async (tx) => {
      const relationUpdates: Prisma.VehicleUpdateInput = {};

      if (dto.documents?.soat) {
        const id = await this.upsertRelatedDocument(
          tx,
          current.soatId,
          "SOAT",
          dto.documents.soat,
        );
        relationUpdates.soat = { connect: { id } };
      }

      if (dto.documents?.technicalInspection) {
        const id = await this.upsertRelatedDocument(
          tx,
          current.technicalInspectionId,
          "TECHNICAL_INSPECTION",
          dto.documents.technicalInspection,
        );
        relationUpdates.technicalInspection = { connect: { id } };
      }

      if (dto.documents?.insurance) {
        const id = await this.upsertRelatedDocument(
          tx,
          current.insuranceId,
          "INSURANCE",
          dto.documents.insurance,
        );
        relationUpdates.insurance = { connect: { id } };
      }

      if (dto.documents?.propertyCard) {
        const id = await this.upsertRelatedDocument(
          tx,
          current.propertyCardId,
          "PROPERTY_CARD",
          dto.documents.propertyCard,
        );
        relationUpdates.propertyCard = { connect: { id } };
      }

      return tx.vehicle.update({
        where: { plate: normalizedPlate },
        data: {
          passengerCapacity: dto.passengerCapacity,
          brand: dto.brand,
          model: dto.model,
          year: dto.year,
          status: dto.status,
          ...relationUpdates,
        },
        select: this.vehicleSelect,
      });
    });
  }

  async inactivate(plate: string, responsibleUser?: string) {
    const normalizedPlate = plate.trim().toUpperCase();
    const current = await this.ensureVehicleExists(normalizedPlate);

    if (current.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar el vehiculo",
        errors: ["El vehiculo ya se encuentra inactivo"],
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.vehicleStatusHistory.create({
        data: {
          vehiclePlate: normalizedPlate,
          previousStatus: current.status,
          newStatus: "INACTIVE",
          reason: "Inactivacion logica desde el modulo de vehiculos",
          responsibleUser: responsibleUser ?? "system",
        },
      });

      return tx.vehicle.update({
        where: { plate: normalizedPlate },
        data: { status: "INACTIVE" },
        select: this.vehicleSelect,
      });
    });
  }

  // Etiquetas legibles de los documentos con vencimiento que bloquean.
  private static readonly EXPIRABLE_DOC_LABELS: Record<string, string> = {
    SOAT: "SOAT",
    TECHNICAL_INSPECTION: "Tecnomecanica",
    INSURANCE: "Seguro",
  };

  /**
   * Verifica que el vehiculo no tenga documentos vencidos (vencimiento <= hoy).
   * Lanza 400 con el detalle de cada documento vencido. La tarjeta de propiedad
   * no tiene vencimiento, por lo que no se valida.
   * Se usa al asignar el vehiculo a una ruta activa y al iniciar un viaje.
   */
  async assertDocumentsValid(plate: string): Promise<void> {
    const normalizedPlate = plate.trim().toUpperCase();
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: normalizedPlate },
      select: {
        plate: true,
        soat: { select: { documentType: true, expiryDate: true } },
        technicalInspection: {
          select: { documentType: true, expiryDate: true },
        },
        insurance: { select: { documentType: true, expiryDate: true } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException({
        success: false,
        message: "Vehiculo no encontrado",
      });
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    const expirables = [
      vehicle.soat,
      vehicle.technicalInspection,
      vehicle.insurance,
    ];

    const expired: string[] = [];
    for (const doc of expirables) {
      if (!doc?.expiryDate) continue;
      const expiry = doc.expiryDate.toISOString().slice(0, 10);
      if (expiry <= today) {
        const label =
          VehiclesService.EXPIRABLE_DOC_LABELS[doc.documentType] ??
          doc.documentType;
        expired.push(`${label} vencido (venció el ${expiry})`);
      }
    }

    if (expired.length) {
      throw new BadRequestException({
        success: false,
        message: `El vehículo ${normalizedPlate} tiene documentos vencidos y no puede ser asignado ni operar`,
        errors: expired,
      });
    }
  }

  private async validateCreateBusinessRules(dto: CreateVehicleDto) {
    const errors: string[] = [];
    const normalizedPlate = dto.plate.trim().toUpperCase();

    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plate: normalizedPlate },
      select: { plate: true },
    });

    if (existingVehicle) {
      errors.push("Ya existe un vehiculo con esa placa");
    }

    await this.validateDocumentNumberDuplications(undefined, dto, errors);

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar el vehiculo",
        errors,
      });
    }
  }

  private async validateUpdateBusinessRules(
    dto: UpdateVehicleDto,
    current: {
      soatId: number | null;
      technicalInspectionId: number | null;
      insuranceId: number | null;
      propertyCardId: number | null;
    },
  ) {
    const errors: string[] = [];

    await this.validateDocumentNumberDuplications(current, dto, errors);

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar el vehiculo",
        errors,
      });
    }
  }

  private async validateDocumentNumberDuplications(
    current:
      | {
          soatId: number | null;
          technicalInspectionId: number | null;
          insuranceId: number | null;
          propertyCardId: number | null;
        }
      | undefined,
    dto: CreateVehicleDto | UpdateVehicleDto,
    errors: string[],
  ) {
    const entries: Array<{
      type: "SOAT" | "TECHNICAL_INSPECTION" | "INSURANCE" | "PROPERTY_CARD";
      number?: string;
      currentId?: number | null;
    }> = [
      {
        type: "SOAT",
        number: dto.documents?.soat?.documentNumber,
        currentId: current?.soatId,
      },
      {
        type: "TECHNICAL_INSPECTION",
        number: dto.documents?.technicalInspection?.documentNumber,
        currentId: current?.technicalInspectionId,
      },
      {
        type: "INSURANCE",
        number: dto.documents?.insurance?.documentNumber,
        currentId: current?.insuranceId,
      },
      {
        type: "PROPERTY_CARD",
        number: dto.documents?.propertyCard?.documentNumber,
        currentId: current?.propertyCardId,
      },
    ];

    for (const item of entries) {
      if (!item.number) continue;

      const duplicate = await this.prisma.vehicleDocument.findFirst({
        where: {
          documentType: item.type,
          documentNumber: item.number,
          ...(item.currentId ? { id: { not: item.currentId } } : {}),
        },
        select: { id: true },
      });

      if (duplicate) {
        errors.push(`Ya existe un ${item.type} con ese numero de documento`);
      }
    }
  }

  private async ensureVehicleExists(plate: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate },
      select: {
        plate: true,
        status: true,
        soatId: true,
        technicalInspectionId: true,
        insuranceId: true,
        propertyCardId: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException({
        success: false,
        message: "Vehiculo no encontrado",
      });
    }

    return vehicle;
  }

  private async createVehicleDocument(
    tx: Prisma.TransactionClient,
    documentType: "SOAT" | "TECHNICAL_INSPECTION" | "INSURANCE" | "PROPERTY_CARD",
    payload: {
      documentNumber: string;
      issueDate?: string;
      expiryDate?: string;
      fileUrl?: string;
    },
  ) {
    return tx.vehicleDocument.create({
      data: {
        documentType,
        documentNumber: payload.documentNumber,
        issueDate: payload.issueDate ? new Date(payload.issueDate) : undefined,
        expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
        fileUrl: payload.fileUrl,
        status: "ACTIVE",
      },
      select: { id: true },
    });
  }

  private async upsertRelatedDocument(
    tx: Prisma.TransactionClient,
    currentDocumentId: number | null,
    documentType: "SOAT" | "TECHNICAL_INSPECTION" | "INSURANCE" | "PROPERTY_CARD",
    payload: {
      documentNumber: string;
      issueDate?: string;
      expiryDate?: string;
      fileUrl?: string;
    },
  ) {
    if (currentDocumentId) {
      // Si llega un archivo nuevo distinto, borramos el anterior de R2 (best-effort).
      const previous = await tx.vehicleDocument.findUnique({
        where: { id: currentDocumentId },
        select: { fileUrl: true },
      });

      await tx.vehicleDocument.update({
        where: { id: currentDocumentId },
        data: {
          documentType,
          documentNumber: payload.documentNumber,
          issueDate: payload.issueDate ? new Date(payload.issueDate) : undefined,
          expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
          fileUrl: payload.fileUrl,
          status: "ACTIVE",
        },
      });

      if (
        payload.fileUrl &&
        previous?.fileUrl &&
        previous.fileUrl !== payload.fileUrl
      ) {
        await this.storage.deleteObject(previous.fileUrl);
      }

      return currentDocumentId;
    }

    const created = await this.createVehicleDocument(tx, documentType, payload);
    return created.id;
  }
}
