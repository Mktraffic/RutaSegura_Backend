import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTripDto } from "./dto/trip.dto";

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly tripSelect = {
    id: true,
    routeId: true,
    vehiclePlate: true,
    driverPersonId: true,
    tripDate: true,
    status: true,
    startedAt: true,
    endedAt: true,
    observations: true,
    createdAt: true,
    route: {
      select: {
        id: true,
        name: true,
        status: true,
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
        status: true,
      },
    },
  };

  async create(dto: CreateTripDto) {
    await this.validateCreateBusinessRules(dto);

    return this.prisma.trip.create({
      data: {
        routeId: dto.routeId,
        vehiclePlate: dto.vehiclePlate.trim().toUpperCase(),
        driverPersonId: dto.driverPersonId,
        tripDate: new Date(dto.tripDate),
        status: "PENDING_CHECKLIST",
        observations: dto.observations,
      },
      select: this.tripSelect,
    });
  }

  async findAll(query?: {
    routeId?: number;
    status?: string;
    vehiclePlate?: string;
    driverPersonId?: number;
    tripDate?: string;
  }) {
    return this.prisma.trip.findMany({
      where: {
        routeId: query?.routeId,
        status: query?.status?.trim(),
        vehiclePlate: query?.vehiclePlate
          ? query.vehiclePlate.trim().toUpperCase()
          : undefined,
        driverPersonId: query?.driverPersonId,
        tripDate: query?.tripDate ? new Date(query.tripDate) : undefined,
      },
      orderBy: { id: "desc" },
      select: this.tripSelect,
    });
  }

  async findOne(id: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      select: this.tripSelect,
    });

    if (!trip) {
      throw new NotFoundException({
        success: false,
        message: "Viaje no encontrado",
      });
    }

    return trip;
  }

  async enable(id: number) {
    const trip = await this.ensureTripExists(id);

    if (trip.status?.toUpperCase() === "ENABLED") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo habilitar el viaje",
        errors: ["El viaje ya esta habilitado"],
      });
    }

    const checklist = await this.prisma.checklist.findUnique({
      where: { tripId: id },
      select: { status: true },
    });

    if (!checklist) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo habilitar el viaje",
        errors: ["Debes completar la lista de chequeo antes de habilitar el viaje"],
      });
    }

    if (checklist.status !== "APPROVED") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo habilitar el viaje",
        errors: ["La lista de chequeo no esta aprobada"],
      });
    }

    return this.prisma.trip.update({
      where: { id },
      data: { status: "ENABLED" },
      select: this.tripSelect,
    });
  }

  private async validateCreateBusinessRules(dto: CreateTripDto) {
    const errors: string[] = [];

    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
      select: { id: true, status: true, vehiclePlate: true, driverPersonId: true },
    });

    if (!route) {
      errors.push("La ruta indicada no existe");
    } else if (route.status?.toUpperCase() !== "ACTIVE") {
      errors.push("La ruta debe estar activa para registrar un viaje");
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

    if (route?.vehiclePlate) {
      const normalizedPlate = dto.vehiclePlate.trim().toUpperCase();
      if (route.vehiclePlate !== normalizedPlate) {
        errors.push("El vehiculo no corresponde a la ruta seleccionada");
      }
    }

    if (route?.driverPersonId && route.driverPersonId !== dto.driverPersonId) {
      errors.push("El conductor no corresponde a la ruta seleccionada");
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar el viaje",
        errors,
      });
    }
  }

  private async ensureTripExists(id: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!trip) {
      throw new NotFoundException({
        success: false,
        message: "Viaje no encontrado",
      });
    }

    return trip;
  }
}
