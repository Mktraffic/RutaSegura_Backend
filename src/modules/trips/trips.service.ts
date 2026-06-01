import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { StorageService } from "../storage/storage.service";
import { VehiclesService } from "../vehicles/vehicles.service";
import {
  CancelTripDto,
  CreateTripDto,
  FinishTripDto,
  ReviewTripDto,
  SubmitChecklistDto,
} from "./dto/trip.dto";

// Estados del viaje (ver comentario del modelo Trip en schema.prisma).
export const TRIP_STATUS = {
  PENDING_CHECKLIST: "PENDING_CHECKLIST",
  PENDING_REVIEW: "PENDING_REVIEW",
  ENABLED: "ENABLED",
  REJECTED: "REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

type TripFilters = {
  status?: string;
  from?: string;
  to?: string;
  routeId?: number;
  driverPersonId?: number;
};

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  private readonly tripInclude = {
    route: {
      select: {
        id: true,
        name: true,
        routeType: true,
        startTime: true,
        endTime: true,
        zone: { select: { id: true, name: true } },
      },
    },
    vehicle: { select: { plate: true, brand: true, model: true } },
    driver: {
      select: {
        id: true,
        firstName: true,
        middleName: true,
        firstLastname: true,
        secondLastname: true,
      },
    },
    checklist: {
      include: {
        items: { orderBy: { id: "asc" } },
        reviewedByUser: { select: { id: true, email: true } },
      },
    },
  } satisfies Prisma.TripInclude;

  // Ítems del checklist preoperacional (catálogo activo).
  async getChecklistTemplate() {
    return this.prisma.checklistTemplate.findMany({
      where: { status: { equals: "ACTIVE", mode: "insensitive" } },
      orderBy: { id: "asc" },
      select: { id: true, itemName: true, required: true },
    });
  }

  // ───────────────────────────────────────────────
  // COORDINADOR / ADMIN
  // ───────────────────────────────────────────────

  async create(dto: CreateTripDto, createdByUserId: number) {
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
      select: {
        id: true,
        name: true,
        status: true,
        vehiclePlate: true,
        driverPersonId: true,
      },
    });

    if (!route) {
      throw new NotFoundException({
        success: false,
        message: "La ruta indicada no existe",
      });
    }

    const errors: string[] = [];
    if (route.status?.toUpperCase() !== "ACTIVE") {
      errors.push("La ruta no está activa");
    }

    const driverPersonId = dto.driverPersonId ?? route.driverPersonId ?? null;
    const vehiclePlate = (dto.vehiclePlate ?? route.vehiclePlate ?? "")
      .trim()
      .toUpperCase();

    if (!driverPersonId) {
      errors.push(
        "Debes indicar un conductor (la ruta no tiene conductor asignado)",
      );
    } else {
      const driver = await this.prisma.person.findUnique({
        where: { id: driverPersonId },
        select: { id: true, personType: true, status: true },
      });
      if (!driver || driver.personType !== "DRIVER") {
        errors.push("El conductor indicado no existe");
      } else if (driver.status?.toUpperCase() !== "ACTIVE") {
        errors.push("El conductor indicado no está activo");
      }
    }

    if (!vehiclePlate) {
      errors.push(
        "Debes indicar un vehículo (la ruta no tiene vehículo asignado)",
      );
    } else {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { plate: vehiclePlate },
        select: { plate: true, status: true },
      });
      if (!vehicle) {
        errors.push("El vehículo indicado no existe");
      } else if (vehicle.status?.toUpperCase() !== "ACTIVE") {
        errors.push("El vehículo indicado no está activo");
      }
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo programar el viaje",
        errors,
      });
    }

    const tripDate = new Date(dto.tripDate);
    const duplicate = await this.prisma.trip.findFirst({
      where: {
        routeId: dto.routeId,
        tripDate,
        status: { not: TRIP_STATUS.CANCELLED },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo programar el viaje",
        errors: ["Ya existe un viaje programado para esta ruta en esa fecha"],
      });
    }

    // Bloqueo por documentos vencidos del vehículo.
    await this.vehicles.assertDocumentsValid(vehiclePlate);

    const trip = await this.prisma.trip.create({
      data: {
        routeId: dto.routeId,
        vehiclePlate,
        driverPersonId: driverPersonId as number,
        tripDate,
        status: TRIP_STATUS.PENDING_CHECKLIST,
        observations: dto.observations,
        createdByUserId,
      },
      select: { id: true },
    });

    return this.findOne(trip.id);
  }

  async findAll(filters: TripFilters) {
    const where: Prisma.TripWhereInput = {};
    if (filters.status) {
      where.status = { equals: filters.status, mode: "insensitive" };
    }
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.driverPersonId) where.driverPersonId = filters.driverPersonId;
    if (filters.from || filters.to) {
      where.tripDate = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    return this.prisma.trip.findMany({
      where,
      orderBy: [{ tripDate: "desc" }, { id: "desc" }],
      include: this.tripInclude,
    });
  }

  async findOne(id: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: this.tripInclude,
    });
    if (!trip) {
      throw new NotFoundException({
        success: false,
        message: "Viaje no encontrado",
      });
    }
    return trip;
  }

  async approve(id: number, reviewerUserId: number, dto: ReviewTripDto) {
    const trip = await this.findOne(id);
    this.assertReviewable(trip);

    await this.prisma.$transaction(async (tx) => {
      await tx.checklist.update({
        where: { id: trip.checklist!.id },
        data: {
          status: "APPROVED",
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes ?? null,
        },
      });
      await tx.trip.update({
        where: { id },
        data: { status: TRIP_STATUS.ENABLED },
      });
    });

    await this.notifications.notifyTripReviewed(
      trip.driverPersonId,
      this.buildContext(trip),
      true,
      dto.reviewNotes,
    );

    return this.findOne(id);
  }

  async reject(id: number, reviewerUserId: number, dto: ReviewTripDto) {
    const trip = await this.findOne(id);
    this.assertReviewable(trip);

    if (!dto.reviewNotes?.trim()) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo rechazar el preoperacional",
        errors: ["Debes indicar el motivo del rechazo"],
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.checklist.update({
        where: { id: trip.checklist!.id },
        data: {
          status: "REJECTED",
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes,
        },
      });
      await tx.trip.update({
        where: { id },
        data: { status: TRIP_STATUS.REJECTED },
      });
    });

    await this.notifications.notifyTripReviewed(
      trip.driverPersonId,
      this.buildContext(trip),
      false,
      dto.reviewNotes,
    );

    return this.findOne(id);
  }

  async cancel(id: number, dto: CancelTripDto) {
    const trip = await this.findOne(id);
    const status = trip.status?.toUpperCase();
    if (
      status === TRIP_STATUS.COMPLETED ||
      status === TRIP_STATUS.CANCELLED
    ) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo cancelar el viaje",
        errors: ["No se puede cancelar un viaje finalizado o ya cancelado"],
      });
    }

    await this.prisma.trip.update({
      where: { id },
      data: {
        status: TRIP_STATUS.CANCELLED,
        observations: dto.reason ?? trip.observations,
      },
    });

    return this.findOne(id);
  }

  // ───────────────────────────────────────────────
  // CONDUCTOR
  // ───────────────────────────────────────────────

  async findMine(driverPersonId: number, filters: TripFilters) {
    return this.findAll({ ...filters, driverPersonId });
  }

  async findOneForDriver(id: number, driverPersonId: number) {
    return this.ensureTripOwnedByDriver(id, driverPersonId);
  }

  async submitChecklist(
    id: number,
    driverPersonId: number,
    dto: SubmitChecklistDto,
  ) {
    const trip = await this.ensureTripOwnedByDriver(id, driverPersonId);
    const status = trip.status?.toUpperCase();
    if (
      status !== TRIP_STATUS.PENDING_CHECKLIST &&
      status !== TRIP_STATUS.REJECTED
    ) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo enviar el preoperacional",
        errors: [
          "El preoperacional solo se puede enviar cuando el viaje está pendiente de checklist o fue rechazado",
        ],
      });
    }

    await this.validateChecklistItems(dto);

    const previous = trip.checklist;
    const previousKeys: string[] = [];
    if (previous) {
      if (previous.vehiclePhotoKey) previousKeys.push(previous.vehiclePhotoKey);
      if (previous.signatureKey) previousKeys.push(previous.signatureKey);
      for (const item of previous.items) {
        if (item.fileUrl) previousKeys.push(item.fileUrl);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      let checklistId: number;
      if (previous) {
        await tx.checklistItem.deleteMany({
          where: { checklistId: previous.id },
        });
        await tx.checklist.update({
          where: { id: previous.id },
          data: {
            vehiclePlate: trip.vehiclePlate,
            status: "PENDING",
            generalObservations: dto.generalObservations,
            vehiclePhotoKey: dto.vehiclePhotoKey,
            signatureKey: dto.signatureKey,
            latitude: dto.latitude,
            longitude: dto.longitude,
            submittedAt: new Date(),
            reviewedByUserId: null,
            reviewedAt: null,
            reviewNotes: null,
          },
        });
        checklistId = previous.id;
      } else {
        const created = await tx.checklist.create({
          data: {
            tripId: id,
            vehiclePlate: trip.vehiclePlate,
            status: "PENDING",
            generalObservations: dto.generalObservations,
            vehiclePhotoKey: dto.vehiclePhotoKey,
            signatureKey: dto.signatureKey,
            latitude: dto.latitude,
            longitude: dto.longitude,
            submittedAt: new Date(),
          },
        });
        checklistId = created.id;
      }

      await tx.checklistItem.createMany({
        data: dto.items.map((item) => ({
          checklistId,
          itemName: item.itemName.trim(),
          passed: item.passed,
          observations: item.observations,
          fileUrl: item.fileKey ?? null,
        })),
      });

      await tx.trip.update({
        where: { id },
        data: { status: TRIP_STATUS.PENDING_REVIEW },
      });
    });

    // Limpieza best-effort de objetos reemplazados en R2.
    const newKeys = new Set<string>([
      dto.vehiclePhotoKey,
      dto.signatureKey,
      ...dto.items.map((i) => i.fileKey).filter((k): k is string => Boolean(k)),
    ]);
    for (const key of previousKeys) {
      if (!newKeys.has(key)) await this.storage.deleteObject(key);
    }

    await this.notifications.notifyTripSubmittedForReview(
      this.buildContext(trip),
    );

    return this.findOne(id);
  }

  async start(id: number, driverPersonId: number) {
    const trip = await this.ensureTripOwnedByDriver(id, driverPersonId);
    if (trip.status?.toUpperCase() !== TRIP_STATUS.ENABLED) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo iniciar el viaje",
        errors: [
          "El viaje no está habilitado. El coordinador debe aprobar el preoperacional primero",
        ],
      });
    }

    // Revalidación de documentos del vehículo al momento de iniciar.
    await this.vehicles.assertDocumentsValid(trip.vehiclePlate);

    await this.prisma.trip.update({
      where: { id },
      data: { status: TRIP_STATUS.IN_PROGRESS, startedAt: new Date() },
    });

    return this.findOne(id);
  }

  // El conductor reporta su ubicación (solo viaje propio y en curso).
  // Consulta liviana: se llama con frecuencia durante el recorrido.
  async updateLocation(
    id: number,
    driverPersonId: number,
    dto: { latitude: number; longitude: number },
  ) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      select: { id: true, driverPersonId: true, status: true },
    });
    if (!trip) {
      throw new NotFoundException({
        success: false,
        message: "Viaje no encontrado",
      });
    }
    if (trip.driverPersonId !== driverPersonId) {
      throw new ForbiddenException({
        success: false,
        message: "No tienes acceso a este viaje",
      });
    }
    if (trip.status?.toUpperCase() !== TRIP_STATUS.IN_PROGRESS) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar la ubicación",
        errors: ["Solo puedes compartir ubicación de un viaje en curso"],
      });
    }

    await this.prisma.trip.update({
      where: { id },
      data: {
        currentLatitude: dto.latitude,
        currentLongitude: dto.longitude,
        locationUpdatedAt: new Date(),
      },
    });

    return { latitude: dto.latitude, longitude: dto.longitude };
  }

  // Viajes en curso de las rutas a las que están asignados los hijos del
  // acudiente, con la última posición del bus.
  async findActiveTripsForGuardian(guardianPersonId: number) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { personId: guardianPersonId },
      select: { id: true },
    });
    if (!guardian) {
      throw new NotFoundException({
        success: false,
        message: "No encontramos un acudiente asociado a tu usuario",
      });
    }

    const children = await this.prisma.person.findMany({
      where: { personType: "STUDENT", guardianId: guardian.id },
      select: {
        firstName: true,
        middleName: true,
        firstLastname: true,
        secondLastname: true,
        routeAssignments: {
          where: { status: "ACTIVE" },
          select: { routeId: true },
        },
      },
    });

    // routeId -> nombres de los hijos del acudiente en esa ruta.
    const childrenByRoute = new Map<number, string[]>();
    for (const child of children) {
      const name = this.fullName(child);
      for (const assignment of child.routeAssignments) {
        const list = childrenByRoute.get(assignment.routeId) ?? [];
        list.push(name);
        childrenByRoute.set(assignment.routeId, list);
      }
    }

    const routeIds = [...childrenByRoute.keys()];
    if (!routeIds.length) return [];

    const trips = await this.prisma.trip.findMany({
      where: { routeId: { in: routeIds }, status: TRIP_STATUS.IN_PROGRESS },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        routeId: true,
        startedAt: true,
        currentLatitude: true,
        currentLongitude: true,
        locationUpdatedAt: true,
        route: { select: { id: true, name: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
        driver: {
          select: {
            firstName: true,
            middleName: true,
            firstLastname: true,
            secondLastname: true,
          },
        },
      },
    });

    return trips.map((trip) => ({
      tripId: trip.id,
      routeId: trip.routeId,
      routeName: trip.route.name,
      vehiclePlate: trip.vehicle.plate,
      vehicleLabel: [trip.vehicle.brand, trip.vehicle.model]
        .filter(Boolean)
        .join(" "),
      driverName: this.fullName(trip.driver),
      startedAt: trip.startedAt,
      latitude: trip.currentLatitude ? Number(trip.currentLatitude) : null,
      longitude: trip.currentLongitude ? Number(trip.currentLongitude) : null,
      locationUpdatedAt: trip.locationUpdatedAt,
      children: childrenByRoute.get(trip.routeId) ?? [],
    }));
  }

  async finish(id: number, driverPersonId: number, dto: FinishTripDto) {
    const trip = await this.ensureTripOwnedByDriver(id, driverPersonId);
    if (trip.status?.toUpperCase() !== TRIP_STATUS.IN_PROGRESS) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo finalizar el viaje",
        errors: ["Solo se puede finalizar un viaje que está en curso"],
      });
    }

    await this.prisma.trip.update({
      where: { id },
      data: {
        status: TRIP_STATUS.COMPLETED,
        endedAt: new Date(),
        observations: dto.observations ?? trip.observations,
      },
    });

    return this.findOne(id);
  }

  // ───────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────

  private async ensureTripOwnedByDriver(id: number, driverPersonId: number) {
    const trip = await this.findOne(id);
    if (trip.driverPersonId !== driverPersonId) {
      throw new ForbiddenException({
        success: false,
        message: "No tienes acceso a este viaje",
      });
    }
    return trip;
  }

  private assertReviewable(trip: { status: string | null; checklist: unknown }) {
    if (trip.status?.toUpperCase() !== TRIP_STATUS.PENDING_REVIEW) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo revisar el viaje",
        errors: ["El viaje no está pendiente de revisión"],
      });
    }
    if (!trip.checklist) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo revisar el viaje",
        errors: ["El viaje no tiene un preoperacional enviado"],
      });
    }
  }

  private async validateChecklistItems(dto: SubmitChecklistDto) {
    const templates = await this.prisma.checklistTemplate.findMany({
      where: {
        required: true,
        status: { equals: "ACTIVE", mode: "insensitive" },
      },
      select: { itemName: true },
    });

    const submitted = new Set(
      dto.items.map((item) => item.itemName.trim().toLowerCase()),
    );
    const missing = templates
      .filter((tpl) => !submitted.has(tpl.itemName.trim().toLowerCase()))
      .map((tpl) => tpl.itemName);

    if (missing.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo enviar el preoperacional",
        errors: [`Faltan ítems obligatorios: ${missing.join(", ")}`],
      });
    }

    const failedWithoutPhoto = dto.items
      .filter((item) => !item.passed && !item.fileKey)
      .map((item) => item.itemName);

    if (failedWithoutPhoto.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo enviar el preoperacional",
        errors: [
          `Los ítems en mal estado requieren foto de evidencia: ${failedWithoutPhoto.join(", ")}`,
        ],
      });
    }
  }

  private buildContext(trip: {
    id: number;
    tripDate: Date;
    route: { name: string };
    driver: {
      firstName: string;
      middleName: string | null;
      firstLastname: string;
      secondLastname: string | null;
    };
  }) {
    return {
      tripId: trip.id,
      routeName: trip.route.name,
      driverName: this.fullName(trip.driver),
      tripDate: trip.tripDate.toISOString().slice(0, 10),
    };
  }

  private fullName(person: {
    firstName: string;
    middleName: string | null;
    firstLastname: string;
    secondLastname: string | null;
  }) {
    return [
      person.firstName,
      person.middleName,
      person.firstLastname,
      person.secondLastname,
    ]
      .filter(Boolean)
      .join(" ");
  }
}
