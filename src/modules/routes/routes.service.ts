import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { VehiclesService } from "../vehicles/vehicles.service";
import {
  CreateRouteAssignmentDto,
  CreateRouteDto,
  UpdateRouteAssignmentDto,
  UpdateRouteDto,
} from "./dto/route.dto";

// Tiempo de servicio en cada parada (recoger/dejar a un estudiante).
const SERVICE_TIME_PER_STOP_SECONDS = 60;

type GeoPoint = {
  latitude: number;
  longitude: number;
};

type StudentPoint = GeoPoint & {
  assignmentId: number;
  personId: number;
  name: string;
};

@Injectable()
export class RoutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: VehiclesService,
  ) {}

  private readonly routeInclude = {
    zone: {
      select: {
        id: true,
        name: true,
      },
    },
    destination: {
      select: {
        id: true,
        name: true,
        address: {
          select: {
            id: true,
            address: true,
            zoneId: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    },
    vehicle: {
      select: {
        plate: true,
        brand: true,
        model: true,
        status: true,
      },
    },
    driver: {
      select: {
        id: true,
        firstName: true,
        firstLastname: true,
        personType: true,
        status: true,
      },
    },
    stops: {
      orderBy: {
        stopOrder: "asc",
      },
      select: {
        id: true,
        stopOrder: true,
        description: true,
        latitude: true,
        longitude: true,
        estimatedTime: true,
      },
    },
  } satisfies Prisma.RouteInclude;

  private readonly assignmentInclude = {
    person: {
      select: {
        id: true,
        firstName: true,
        firstLastname: true,
        personType: true,
        status: true,
      },
    },
    stop: {
      select: {
        id: true,
        stopOrder: true,
        description: true,
        latitude: true,
        longitude: true,
        estimatedTime: true,
      },
    },
    personAddress: {
      select: {
        id: true,
        addressType: true,
        validDays: true,
        address: {
          select: {
            id: true,
            address: true,
            zoneId: true,
          },
        },
      },
    },
  } satisfies Prisma.RouteAssignmentInclude;

  async create(dto: CreateRouteDto) {
    await this.validateCreateBusinessRules(dto);
    // La ruta nace ACTIVA, por lo que el vehiculo no puede tener documentos vencidos.
    await this.vehicles.assertDocumentsValid(dto.vehiclePlate);

    return this.prisma.$transaction(async (tx) => {
      const route = await tx.route.create({
        data: {
          name: dto.name.trim(),
          routeType: dto.routeType,
          zoneId: dto.zoneId,
          destinationId: dto.destinationId,
          originDescription: dto.originDescription,
          startTime: this.parseTime(dto.startTime),
          status: "ACTIVE",
          vehiclePlate: dto.vehiclePlate.trim().toUpperCase(),
          driverPersonId: dto.driverPersonId,
        },
      });

      if (dto.assignments?.length) {
        await this.createAssignmentsForRoute(tx, route, dto.assignments);
      }

      return this.findOneInternal(tx, route.id);
    });
  }

  async findAll(query?: string, status?: string, zoneId?: number) {
    return this.prisma.route.findMany({
      where: {
        status: status?.trim() || undefined,
        zoneId: zoneId ?? undefined,
        OR: query
          ? [
              { name: { contains: query, mode: "insensitive" } },
              {
                originDescription: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ]
          : undefined,
      },
      orderBy: { id: "desc" },
      include: this.routeInclude,
    });
  }

  async findOne(id: number) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: this.routeInclude,
    });

    if (!route) {
      throw new NotFoundException({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    return route;
  }

  async update(id: number, dto: UpdateRouteDto) {
    const current = await this.ensureRouteExists(id);
    await this.validateUpdateBusinessRules(id, dto);

    // Si se asigna/cambia el vehiculo y la ruta queda activa, el vehiculo no
    // puede tener documentos vencidos.
    if (dto.vehiclePlate) {
      const effectiveStatus = (dto.status ?? current.status)?.toUpperCase();
      if (effectiveStatus === "ACTIVE") {
        await this.vehicles.assertDocumentsValid(dto.vehiclePlate);
      }
    }

    const updateData: Prisma.RouteUpdateInput = {
      name: dto.name?.trim(),
      routeType: dto.routeType,
      originDescription: dto.originDescription,
      startTime: dto.startTime ? this.parseTime(dto.startTime) : undefined,
      status: dto.status,
      zone: dto.zoneId ? { connect: { id: dto.zoneId } } : undefined,
      destination: dto.destinationId
        ? { connect: { id: dto.destinationId } }
        : undefined,
      vehicle: dto.vehiclePlate
        ? { connect: { plate: dto.vehiclePlate.trim().toUpperCase() } }
        : undefined,
      driver: dto.driverPersonId
        ? { connect: { id: dto.driverPersonId } }
        : undefined,
    };

    await this.prisma.route.update({
      where: { id },
      data: updateData,
    });

    return this.findOne(id);
  }

  async inactivate(id: number) {
    const current = await this.ensureRouteExists(id);

    if (current.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar la ruta",
        errors: ["La ruta ya se encuentra inactiva"],
      });
    }

    return this.prisma.route.update({
      where: { id },
      data: { status: "INACTIVE" },
      include: this.routeInclude,
    });
  }

  async activate(id: number) {
    const current = await this.ensureRouteExists(id);

    if (current.status?.toUpperCase() === "ACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo activar la ruta",
        errors: ["La ruta ya se encuentra activa"],
      });
    }

    // Al reactivar la ruta, el vehiculo asignado no puede tener documentos vencidos.
    if (current.vehiclePlate) {
      await this.vehicles.assertDocumentsValid(current.vehiclePlate);
    }

    return this.prisma.route.update({
      where: { id },
      data: { status: "ACTIVE" },
      include: this.routeInclude,
    });
  }

  // ───────────────────────────────────────────────
  // PORTAL DEL CONDUCTOR
  // El conductor solo ve y exporta las rutas que tiene asignadas.
  // ───────────────────────────────────────────────

  async findRoutesForDriver(driverPersonId: number) {
    return this.prisma.route.findMany({
      where: { driverPersonId },
      orderBy: { id: "desc" },
      include: this.routeInclude,
    });
  }

  async findRouteForDriver(routeId: number, driverPersonId: number) {
    await this.ensureRouteOwnedByDriver(routeId, driverPersonId);

    return this.prisma.route.findUnique({
      where: { id: routeId },
      include: this.routeInclude,
    });
  }

  async getDriverRouteGoogleMapsUrl(routeId: number, driverPersonId: number) {
    await this.ensureRouteOwnedByDriver(routeId, driverPersonId);
    return this.getRouteGoogleMapsUrl(routeId);
  }

  async getDriverRouteGeoJson(routeId: number, driverPersonId: number) {
    await this.ensureRouteOwnedByDriver(routeId, driverPersonId);
    return this.getRouteGeoJson(routeId);
  }

  private async ensureRouteOwnedByDriver(
    routeId: number,
    driverPersonId: number,
  ) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, driverPersonId },
      select: { id: true },
    });

    if (!route) {
      throw new NotFoundException({
        success: false,
        message: "Ruta no encontrada o no asignada a este conductor",
      });
    }

    return route;
  }

  // ───────────────────────────────────────────────
  // PORTAL DEL ACUDIENTE (GUARDIAN)
  // El acudiente ve las rutas que tienen asignados a sus hijos.
  // ───────────────────────────────────────────────

  async findChildrenRoutesForGuardian(guardianPersonId: number) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { personId: guardianPersonId },
      select: { id: true, firstName: true, firstLastname: true },
    });

    if (!guardian) {
      throw new NotFoundException({
        success: false,
        message: "No encontramos un acudiente asociado a tu usuario",
      });
    }

    const children = await this.prisma.person.findMany({
      where: { personType: "STUDENT", guardianId: guardian.id },
      orderBy: [{ firstName: "asc" }, { firstLastname: "asc" }],
      select: {
        id: true,
        firstName: true,
        middleName: true,
        firstLastname: true,
        secondLastname: true,
        status: true,
        routeAssignments: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            status: true,
            stop: {
              select: {
                id: true,
                stopOrder: true,
                description: true,
                latitude: true,
                longitude: true,
                estimatedTime: true,
              },
            },
            route: { include: this.routeInclude },
          },
        },
      },
    });

    return children.map((child) => ({
      id: child.id,
      firstName: child.firstName,
      middleName: child.middleName,
      firstLastname: child.firstLastname,
      secondLastname: child.secondLastname,
      status: child.status,
      routes: child.routeAssignments.map((assignment) => ({
        assignmentId: assignment.id,
        assignmentStatus: assignment.status,
        stop: assignment.stop,
        route: assignment.route,
      })),
    }));
  }

  async getFormOptions() {
    const [zones, destinations, vehicles, drivers] = await Promise.all([
      this.prisma.zone.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, status: true },
      }),
      this.prisma.headquarters.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      this.prisma.vehicle.findMany({
        where: { status: "ACTIVE" },
        orderBy: { plate: "asc" },
        select: {
          plate: true,
          brand: true,
          model: true,
          passengerCapacity: true,
        },
      }),
      this.prisma.person.findMany({
        where: { personType: "DRIVER", status: "ACTIVE" },
        orderBy: [{ firstName: "asc" }, { firstLastname: "asc" }],
        select: { id: true, firstName: true, firstLastname: true },
      }),
    ]);

    return { zones, destinations, vehicles, drivers };
  }

  async listAssignments(routeId: number) {
    await this.ensureRouteExists(routeId);

    return this.prisma.routeAssignment.findMany({
      where: { routeId },
      orderBy: { id: "desc" },
      include: this.assignmentInclude,
    });
  }

  async createAssignment(routeId: number, dto: CreateRouteAssignmentDto) {
    const route = await this.ensureRouteExists(routeId);

    if (route.status?.toUpperCase() !== "ACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo asignar el estudiante",
        errors: ["La ruta debe estar activa para asignaciones"],
      });
    }

    await this.validateAssignment(route, dto.personId, dto.personAddressId);

    const existingAssignment = await this.prisma.routeAssignment.findFirst({
      where: {
        personId: dto.personId,
        status: "ACTIVE",
      },
      select: { id: true, routeId: true },
    });

    if (existingAssignment) {
      const conflictMessage =
        existingAssignment.routeId === routeId
          ? "El estudiante ya tiene una asignacion activa en esta ruta"
          : "El estudiante ya tiene una asignacion activa en otra ruta";

      throw new BadRequestException({
        success: false,
        message: "No se pudo asignar el estudiante",
        errors: [conflictMessage],
      });
    }

    return this.prisma.routeAssignment.create({
      data: {
        routeId,
        personId: dto.personId,
        personAddressId: dto.personAddressId,
        status: "ACTIVE",
      },
      include: this.assignmentInclude,
    });
  }

  async updateAssignment(
    routeId: number,
    assignmentId: number,
    dto: UpdateRouteAssignmentDto,
  ) {
    await this.ensureAssignmentExists(routeId, assignmentId);

    return this.prisma.routeAssignment.update({
      where: { id: assignmentId },
      data: {
        status: dto.status,
      },
      include: this.assignmentInclude,
    });
  }

  async inactivateAssignment(routeId: number, assignmentId: number) {
    const assignment = await this.ensureAssignmentExists(routeId, assignmentId);

    if (assignment.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar la asignacion",
        errors: ["La asignacion ya se encuentra inactiva"],
      });
    }

    return this.prisma.routeAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "INACTIVE",
      },
      include: this.assignmentInclude,
    });
  }

  // ───────────────────────────────────────────────
  // CÁLCULO Y OPTIMIZACIÓN DE LA RUTA
  // Origen y destino fijos = sede del colegio.
  // Puntos intermedios = casas de los estudiantes asignados.
  // ───────────────────────────────────────────────

  async calculateRoute(routeId: number) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      select: {
        id: true,
        startTime: true,
        destination: {
          select: {
            name: true,
            address: {
              select: { latitude: true, longitude: true },
            },
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    if (!route.destination?.address) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo calcular la ruta",
        errors: ["La ruta no tiene una sede de destino con ubicacion"],
      });
    }

    const school: GeoPoint & { name: string } = {
      name: route.destination.name,
      latitude: Number(route.destination.address.latitude),
      longitude: Number(route.destination.address.longitude),
    };

    const assignments = await this.prisma.routeAssignment.findMany({
      where: { routeId, status: "ACTIVE" },
      select: {
        id: true,
        personId: true,
        person: { select: { firstName: true, firstLastname: true } },
        personAddress: {
          select: {
            address: {
              select: { latitude: true, longitude: true },
            },
          },
        },
      },
    });

    const students: StudentPoint[] = assignments
      .filter((assignment) => assignment.personAddress?.address)
      .map((assignment) => ({
        assignmentId: assignment.id,
        personId: assignment.personId,
        name: `${assignment.person.firstName} ${assignment.person.firstLastname}`.trim(),
        latitude: Number(assignment.personAddress!.address.latitude),
        longitude: Number(assignment.personAddress!.address.longitude),
      }));

    if (students.length === 0) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo calcular la ruta",
        errors: [
          "Asigna al menos un estudiante con direccion antes de calcular la ruta",
        ],
      });
    }

    const ordered = this.optimizeStudentOrder(school, students);

    // colegio -> casas (orden optimizado) -> colegio
    const coordinates: number[][] = [
      [school.longitude, school.latitude],
      ...ordered.map((student) => [student.longitude, student.latitude]),
      [school.longitude, school.latitude],
    ];

    const { geometry, summary, segments } =
      await this.fetchOrsDirections(coordinates);

    const startSeconds = this.secondsFromMidnight(route.startTime);
    let cumulative = startSeconds;

    const orderedStops = ordered.map((student, index) => {
      cumulative += segments[index]?.duration ?? 0;
      const etaSeconds = cumulative;
      cumulative += SERVICE_TIME_PER_STOP_SECONDS;
      return { ...student, stopOrder: index + 1, etaSeconds };
    });

    // tramo final de regreso al colegio
    cumulative += segments[ordered.length]?.duration ?? 0;
    const endSeconds = cumulative;
    const totalDuration = endSeconds - startSeconds;

    const waypoints = [
      {
        role: "ORIGIN",
        name: school.name,
        latitude: school.latitude,
        longitude: school.longitude,
        etaSeconds: startSeconds,
      },
      ...orderedStops.map((stop) => ({
        role: "STUDENT",
        personId: stop.personId,
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        stopOrder: stop.stopOrder,
        etaSeconds: stop.etaSeconds,
      })),
      {
        role: "DESTINATION",
        name: school.name,
        latitude: school.latitude,
        longitude: school.longitude,
        etaSeconds: endSeconds,
      },
    ];

    return this.prisma.$transaction(async (tx) => {
      await tx.routeAssignment.updateMany({
        where: { routeId },
        data: { stopId: null },
      });
      await tx.stop.deleteMany({ where: { routeId } });

      for (const stop of orderedStops) {
        const createdStop = await tx.stop.create({
          data: {
            routeId,
            stopOrder: stop.stopOrder,
            description: stop.name,
            latitude: new Prisma.Decimal(stop.latitude),
            longitude: new Prisma.Decimal(stop.longitude),
            estimatedTime: this.secondsToTimeDate(stop.etaSeconds),
          },
        });

        await tx.routeAssignment.update({
          where: { id: stop.assignmentId },
          data: { stopId: createdStop.id },
        });
      }

      await tx.route.update({
        where: { id: routeId },
        data: {
          routeGeometry: geometry,
          routeDistance: summary.distance,
          routeDuration: Math.round(totalDuration),
          routeWaypoints: waypoints,
          routeCalculatedAt: new Date(),
          endTime: this.secondsToTimeDate(endSeconds),
        },
      });

      return this.findOneInternal(tx, routeId);
    });
  }

  async getRouteGeoJson(routeId: number) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      select: {
        routeGeometry: true,
        routeDistance: true,
        routeDuration: true,
      },
    });

    if (!route || !route.routeGeometry) {
      throw new NotFoundException({
        success: false,
        message: "Ruta no calculada",
      });
    }

    return {
      type: "Feature",
      geometry: route.routeGeometry,
      properties: {
        distance: route.routeDistance,
        duration: route.routeDuration,
      },
    };
  }

  async getRouteGoogleMapsUrl(routeId: number) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      select: { routeWaypoints: true },
    });

    if (!route || !route.routeWaypoints) {
      throw new NotFoundException({
        success: false,
        message: "Ruta no calculada",
      });
    }

    const points = this.parseWaypoints(route.routeWaypoints);
    if (points.length < 2) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo construir el enlace",
        errors: ["No hay puntos suficientes para generar la URL"],
      });
    }

    const origin = this.formatLatLng(points[0]);
    const destination = this.formatLatLng(points[points.length - 1]);
    const waypoints = points
      .slice(1, -1)
      .map((point) => this.formatLatLng(point));

    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    if (waypoints.length) {
      url.searchParams.set("waypoints", waypoints.join("|"));
    }

    return url.toString();
  }

  async exportRouteGpx(routeId: number) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      select: {
        routeGeometry: true,
        routeWaypoints: true,
      },
    });

    if (!route || !route.routeGeometry) {
      throw new NotFoundException({
        success: false,
        message: "Ruta no calculada",
      });
    }

    const geometry = route.routeGeometry as {
      type: string;
      coordinates: number[][];
    };
    const trackPoints = geometry.coordinates ?? [];
    const waypoints = this.parseWaypoints(route.routeWaypoints);

    return this.buildGpx(trackPoints, waypoints);
  }

  private async createAssignmentsForRoute(
    tx: Prisma.TransactionClient,
    route: { id: number; zoneId: number | null },
    assignments: Array<{ personId: number; personAddressId: number }>,
  ) {
    for (const assignment of assignments) {
      await this.validateAssignment(
        route,
        assignment.personId,
        assignment.personAddressId,
      );

      const existingAssignment = await this.prisma.routeAssignment.findFirst({
        where: {
          personId: assignment.personId,
          status: "ACTIVE",
        },
        select: { id: true, routeId: true },
      });

      if (existingAssignment) {
        const conflictMessage =
          existingAssignment.routeId === route.id
            ? "El estudiante ya tiene una asignacion activa en esta ruta"
            : "El estudiante ya tiene una asignacion activa en otra ruta";

        throw new BadRequestException({
          success: false,
          message: "No se pudo asignar el estudiante",
          errors: [conflictMessage],
        });
      }

      await tx.routeAssignment.create({
        data: {
          routeId: route.id,
          personId: assignment.personId,
          personAddressId: assignment.personAddressId,
          status: "ACTIVE",
        },
      });
    }
  }

  private async validateCreateBusinessRules(dto: CreateRouteDto) {
    const errors: string[] = [];

    const existingRoute = await this.prisma.route.findFirst({
      where: { name: { equals: dto.name.trim(), mode: "insensitive" } },
      select: { id: true },
    });

    if (existingRoute) {
      errors.push("Ya existe una ruta con ese nombre");
    }

    if (!this.isValidRouteType(dto.routeType)) {
      errors.push("El tipo de ruta no es valido");
    }

    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
      select: { id: true },
    });

    if (!zone) {
      errors.push("La zona indicada no existe");
    }

    const destination = await this.prisma.headquarters.findUnique({
      where: { id: dto.destinationId },
      select: { id: true },
    });

    if (!destination) {
      errors.push("La sede indicada no existe");
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { plate: dto.vehiclePlate.trim().toUpperCase() },
      select: { plate: true, status: true },
    });

    if (!vehicle) {
      errors.push("El vehiculo indicado no existe");
    } else if (vehicle.status?.toUpperCase() !== "ACTIVE") {
      errors.push("El vehiculo indicado no esta activo");
    }

    const driver = await this.prisma.person.findUnique({
      where: { id: dto.driverPersonId },
      select: { id: true, personType: true, status: true },
    });

    if (!driver || driver.personType !== "DRIVER") {
      errors.push("El conductor indicado no existe");
    } else if (driver.status?.toUpperCase() !== "ACTIVE") {
      errors.push("El conductor indicado no esta activo");
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar la ruta",
        errors,
      });
    }
  }

  private async validateUpdateBusinessRules(id: number, dto: UpdateRouteDto) {
    const errors: string[] = [];

    if (dto.name) {
      const existingRoute = await this.prisma.route.findFirst({
        where: {
          id: { not: id },
          name: { equals: dto.name.trim(), mode: "insensitive" },
        },
        select: { id: true },
      });

      if (existingRoute) {
        errors.push("Ya existe una ruta con ese nombre");
      }
    }

    if (dto.routeType && !this.isValidRouteType(dto.routeType)) {
      errors.push("El tipo de ruta no es valido");
    }

    if (dto.zoneId) {
      const zone = await this.prisma.zone.findUnique({
        where: { id: dto.zoneId },
        select: { id: true },
      });

      if (!zone) {
        errors.push("La zona indicada no existe");
      }
    }

    if (dto.destinationId) {
      const destination = await this.prisma.headquarters.findUnique({
        where: { id: dto.destinationId },
        select: { id: true },
      });

      if (!destination) {
        errors.push("La sede indicada no existe");
      }
    }

    if (dto.vehiclePlate) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { plate: dto.vehiclePlate.trim().toUpperCase() },
        select: { plate: true, status: true },
      });

      if (!vehicle) {
        errors.push("El vehiculo indicado no existe");
      } else if (vehicle.status?.toUpperCase() !== "ACTIVE") {
        errors.push("El vehiculo indicado no esta activo");
      }
    }

    if (dto.driverPersonId) {
      const driver = await this.prisma.person.findUnique({
        where: { id: dto.driverPersonId },
        select: { id: true, personType: true, status: true },
      });

      if (!driver || driver.personType !== "DRIVER") {
        errors.push("El conductor indicado no existe");
      } else if (driver.status?.toUpperCase() !== "ACTIVE") {
        errors.push("El conductor indicado no esta activo");
      }
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar la ruta",
        errors,
      });
    }
  }

  private async validateAssignment(
    route: { id: number; zoneId: number | null },
    personId: number,
    personAddressId: number,
  ) {
    const errors: string[] = [];

    const student = await this.prisma.person.findFirst({
      where: { id: personId, personType: "STUDENT" },
      select: { id: true, status: true },
    });

    if (!student) {
      errors.push("El estudiante indicado no existe");
    } else if (student.status?.toUpperCase() !== "ACTIVE") {
      errors.push("El estudiante indicado no esta activo");
    }

    const personAddress = await this.prisma.personAddress.findFirst({
      where: { id: personAddressId, personId },
      select: {
        id: true,
        address: { select: { zoneId: true } },
      },
    });

    if (!personAddress) {
      errors.push("La direccion indicada no pertenece al estudiante");
    } else if (
      route.zoneId &&
      personAddress.address.zoneId &&
      route.zoneId !== personAddress.address.zoneId
    ) {
      errors.push("La direccion no corresponde a la zona de la ruta");
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo asignar el estudiante",
        errors,
      });
    }
  }

  // ───────────────────────────────────────────────
  // OPTIMIZACIÓN (nearest neighbor + 2-opt)
  // ───────────────────────────────────────────────

  private optimizeStudentOrder(
    school: GeoPoint,
    students: StudentPoint[],
  ): StudentPoint[] {
    if (students.length <= 2) {
      return [...students];
    }

    const remaining = [...students];
    const route: StudentPoint[] = [];
    let current: GeoPoint = school;

    // Vecino más cercano partiendo del colegio.
    while (remaining.length) {
      let bestIndex = 0;
      let bestDistance = Infinity;

      for (let i = 0; i < remaining.length; i += 1) {
        const distance = this.haversineMeters(current, remaining[i]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = i;
        }
      }

      const [next] = remaining.splice(bestIndex, 1);
      route.push(next);
      current = next;
    }

    return this.twoOpt(school, route);
  }

  private twoOpt(school: GeoPoint, route: StudentPoint[]): StudentPoint[] {
    let best = [...route];
    let improved = true;

    while (improved) {
      improved = false;
      for (let i = 0; i < best.length - 1; i += 1) {
        for (let k = i + 1; k < best.length; k += 1) {
          const candidate = [
            ...best.slice(0, i),
            ...best.slice(i, k + 1).reverse(),
            ...best.slice(k + 1),
          ];

          if (
            this.roundTripDistance(school, candidate) <
            this.roundTripDistance(school, best) - 1e-6
          ) {
            best = candidate;
            improved = true;
          }
        }
      }
    }

    return best;
  }

  private roundTripDistance(school: GeoPoint, route: StudentPoint[]): number {
    if (route.length === 0) {
      return 0;
    }

    let total = this.haversineMeters(school, route[0]);
    for (let i = 0; i < route.length - 1; i += 1) {
      total += this.haversineMeters(route[i], route[i + 1]);
    }
    total += this.haversineMeters(route[route.length - 1], school);
    return total;
  }

  private haversineMeters(a: GeoPoint, b: GeoPoint): number {
    const earthRadius = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;

    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  private async fetchOrsDirections(coordinates: number[][]) {
    const apiKey = this.getOrsApiKey();

    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // instructions debe ir en true para que ORS incluya el arreglo
          // "segments" (duracion/distancia por tramo) que usamos para las ETAs.
          coordinates,
          instructions: true,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();

      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException({
          success: false,
          message: "No se pudo calcular la ruta",
          errors: [
            "OpenRouteService rechazo la API key. Verifica que ORS_API_KEY en el archivo .env sea valida y reinicia el servidor para recargarla.",
          ],
        });
      }

      throw new BadRequestException({
        success: false,
        message: "No se pudo calcular la ruta",
        errors: ["Error al consultar OpenRouteService", errorBody],
      });
    }

    const data = await response.json();
    const feature = data?.features?.[0];
    const summary = feature?.properties?.summary;
    const segments = feature?.properties?.segments;
    const geometry = feature?.geometry;

    if (!geometry || !summary || !Array.isArray(segments)) {
      // Si ORS devuelve 200 pero sin la estructura esperada (p. ej. un cuerpo
      // de error o de cuota), incluimos un fragmento para poder diagnosticarlo.
      const snippet = JSON.stringify(data ?? {}).slice(0, 300);
      throw new BadRequestException({
        success: false,
        message: "No se pudo calcular la ruta",
        errors: ["La respuesta de OpenRouteService es invalida", snippet],
      });
    }

    return {
      geometry,
      summary: summary as { distance: number; duration: number },
      segments: segments as Array<{ distance: number; duration: number }>,
    };
  }

  private parseWaypoints(value: unknown) {
    if (!Array.isArray(value))
      return [] as Array<{ latitude: number; longitude: number }>;

    return value.filter(
      (point) =>
        typeof point === "object" &&
        point !== null &&
        "latitude" in point &&
        "longitude" in point,
    ) as Array<{ latitude: number; longitude: number }>;
  }

  private formatLatLng(point: { latitude: number; longitude: number }) {
    return `${point.latitude},${point.longitude}`;
  }

  private buildGpx(
    trackPoints: number[][],
    waypoints: Array<{ latitude: number; longitude: number }>,
  ) {
    const header =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<gpx version="1.1" creator="RutaSegura" xmlns="http://www.topografix.com/GPX/1/1">';
    const footer = "</gpx>";

    const waypointXml = waypoints
      .map(
        (point, index) =>
          `<wpt lat="${point.latitude}" lon="${point.longitude}"><name>Parada ${index + 1}</name></wpt>`,
      )
      .join("");

    const trackXml =
      "<trk><name>Ruta calculada</name><trkseg>" +
      trackPoints
        .map(([lng, lat]) => `<trkpt lat="${lat}" lon="${lng}"></trkpt>`)
        .join("") +
      "</trkseg></trk>";

    return `${header}${waypointXml}${trackXml}${footer}`;
  }

  private getOrsApiKey() {
    const key = process.env.ORS_API_KEY?.trim();
    if (!key) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo calcular la ruta",
        errors: ["No se encontro la API key de OpenRouteService"],
      });
    }

    return key;
  }

  private parseTime(value: string) {
    const [hour, minute] = value.split(":").map((item) => Number(item));
    return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
  }

  private secondsFromMidnight(value: Date) {
    return (
      value.getUTCHours() * 3600 +
      value.getUTCMinutes() * 60 +
      value.getUTCSeconds()
    );
  }

  private secondsToTimeDate(seconds: number) {
    const clamped = ((Math.round(seconds) % 86400) + 86400) % 86400;
    return new Date(Date.UTC(1970, 0, 1, 0, 0, 0, 0) + clamped * 1000);
  }

  private isValidRouteType(value: string) {
    return value === "PICKUP" || value === "DROPOFF";
  }

  private async ensureRouteExists(id: number) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      select: {
        id: true,
        zoneId: true,
        status: true,
        startTime: true,
        endTime: true,
        vehiclePlate: true,
      },
    });

    if (!route) {
      throw new NotFoundException({
        success: false,
        message: "Ruta no encontrada",
      });
    }

    return route;
  }

  private async ensureAssignmentExists(routeId: number, assignmentId: number) {
    const assignment = await this.prisma.routeAssignment.findFirst({
      where: { id: assignmentId, routeId },
      select: {
        id: true,
        routeId: true,
        personId: true,
        stopId: true,
        personAddressId: true,
        status: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException({
        success: false,
        message: "Asignacion no encontrada",
      });
    }

    return assignment;
  }

  private async findOneInternal(tx: Prisma.TransactionClient, id: number) {
    return tx.route.findUnique({
      where: { id },
      include: this.routeInclude,
    });
  }
}
