import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateRouteAssignmentDto,
  CreateRouteDto,
  UpdateRouteAssignmentDto,
  UpdateRouteDto,
} from "./dto/route.dto";

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
      const route = await tx.route.create({
        data: {
          name: dto.name.trim(),
          zoneId: dto.zoneId,
          destinationId: dto.destinationId,
          originDescription: dto.originDescription,
          startTime: this.parseTime(dto.startTime),
          endTime: this.parseTime(dto.endTime),
          status: "ACTIVE",
          vehiclePlate: dto.vehiclePlate?.trim().toUpperCase(),
          driverPersonId: dto.driverPersonId,
        },
      });

      await tx.stop.createMany({
        data: dto.stops.map((stop) => ({
          routeId: route.id,
          stopOrder: stop.stopOrder,
          description: stop.description,
          latitude: new Prisma.Decimal(stop.latitude),
          longitude: new Prisma.Decimal(stop.longitude),
          estimatedTime: this.parseTime(stop.estimatedTime),
        })),
      });

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
    await this.validateUpdateBusinessRules(id, dto, current);

    return this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.RouteUpdateInput = {
        name: dto.name?.trim(),
        originDescription: dto.originDescription,
        startTime: dto.startTime ? this.parseTime(dto.startTime) : undefined,
        endTime: dto.endTime ? this.parseTime(dto.endTime) : undefined,
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

      await tx.route.update({
        where: { id },
        data: updateData,
      });

      if (dto.stops) {
        await tx.stop.deleteMany({ where: { routeId: id } });
        await tx.stop.createMany({
          data: dto.stops.map((stop) => ({
            routeId: id,
            stopOrder: stop.stopOrder,
            description: stop.description,
            latitude: new Prisma.Decimal(stop.latitude),
            longitude: new Prisma.Decimal(stop.longitude),
            estimatedTime: this.parseTime(stop.estimatedTime),
          })),
        });
      }

      return this.findOneInternal(tx, id);
    });
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

    await this.validateAssignment(route, dto.personId, dto.stopId, dto.personAddressId);
    const { startDate, endDate } = this.resolveAssignmentDates(
      dto.startDate,
      dto.endDate,
    );

    const existingAssignment = await this.prisma.routeAssignment.findFirst({
      where: {
        routeId,
        personId: dto.personId,
        status: "ACTIVE",
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      select: { id: true },
    });

    if (existingAssignment) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo asignar el estudiante",
        errors: ["El estudiante ya tiene una asignacion activa en esta ruta"],
      });
    }

    return this.prisma.routeAssignment.create({
      data: {
        routeId,
        personId: dto.personId,
        stopId: dto.stopId,
        personAddressId: dto.personAddressId,
        startDate,
        endDate,
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
    const assignment = await this.ensureAssignmentExists(routeId, assignmentId);
    const route = await this.ensureRouteExists(routeId);

    if (dto.stopId || dto.personAddressId) {
      await this.validateAssignment(
        route,
        assignment.personId,
        dto.stopId ?? assignment.stopId,
        dto.personAddressId ?? assignment.personAddressId,
      );
    }

    const { startDate, endDate } = this.resolveAssignmentDates(
      dto.startDate ?? undefined,
      dto.endDate ?? undefined,
    );

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar la asignacion",
        errors: ["La fecha de inicio no puede ser mayor a la fecha fin"],
      });
    }

    return this.prisma.routeAssignment.update({
      where: { id: assignmentId },
      data: {
        stopId: dto.stopId,
        personAddressId: dto.personAddressId,
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
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
        endDate: new Date(),
      },
      include: this.assignmentInclude,
    });
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

    this.ensureValidStops(dto.stops, errors);

    if (dto.startTime && dto.endTime) {
      const startTime = this.parseTime(dto.startTime);
      const endTime = this.parseTime(dto.endTime);
      if (startTime >= endTime) {
        errors.push("La hora de inicio debe ser menor que la hora de fin");
      }
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar la ruta",
        errors,
      });
    }
  }

  private async validateUpdateBusinessRules(
    id: number,
    dto: UpdateRouteDto,
    current: { status: string | null; startTime: Date; endTime: Date },
  ) {
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

    if (dto.stops) {
      const assignmentCount = await this.prisma.routeAssignment.count({
        where: { routeId: id },
      });

      if (assignmentCount > 0) {
        errors.push("No puedes actualizar paradas con asignaciones registradas");
      }

      this.ensureValidStops(dto.stops, errors);
    }

    if (dto.startTime || dto.endTime) {
      const startTime = dto.startTime
        ? this.parseTime(dto.startTime)
        : current.startTime;
      const endTime = dto.endTime ? this.parseTime(dto.endTime) : current.endTime;
      if (startTime >= endTime) {
        errors.push("La hora de inicio debe ser menor que la hora de fin");
      }
    }

    if (current.status?.toUpperCase() === "INACTIVE" && dto.status === "ACTIVE") {
      errors.push("No puedes activar una ruta inactiva desde este endpoint");
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar la ruta",
        errors,
      });
    }
  }

  private ensureValidStops(
    stops: { stopOrder: number }[],
    errors: string[],
  ) {
    const seenOrders = new Set<number>();
    for (const stop of stops) {
      if (seenOrders.has(stop.stopOrder)) {
        errors.push("No puede existir el mismo orden de parada repetido");
      }
      seenOrders.add(stop.stopOrder);
    }
  }

  private async validateAssignment(
    route: { id: number; zoneId: number | null },
    personId: number,
    stopId: number,
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

    const stop = await this.prisma.stop.findFirst({
      where: { id: stopId, routeId: route.id },
      select: { id: true },
    });

    if (!stop) {
      errors.push("La parada indicada no pertenece a la ruta");
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

  private resolveAssignmentDates(startDate?: string, endDate?: string) {
    const start = startDate ? this.parseDate(startDate) : undefined;
    const end = endDate ? this.parseDate(endDate) : undefined;

    if (start && end && start > end) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo asignar el estudiante",
        errors: ["La fecha de inicio no puede ser mayor a la fecha fin"],
      });
    }

    return { startDate: start, endDate: end };
  }

  private parseTime(value: string) {
    const [hour, minute] = value.split(":").map((item) => Number(item));
    return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
  }

  private parseDate(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  private async ensureRouteExists(id: number) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      select: { id: true, zoneId: true, status: true, startTime: true, endTime: true },
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
