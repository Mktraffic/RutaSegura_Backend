import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateChecklistDto } from "./dto/checklist.dto";

@Injectable()
export class ChecklistsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultTemplateItems = [
    "Estado de frenos",
    "Estado de llantas",
    "Luces",
    "Nivel de combustible",
    "Botiquin de primeros auxilios",
    "Extintor",
    "Cinturones de seguridad",
    "Niveles de aceite",
    "Nivel de liquido refrigerante y de frenos",
  ];

  async findTemplates() {
    await this.ensureDefaultTemplates();
    return this.prisma.checklistTemplate.findMany({
      orderBy: { itemName: "asc" },
    });
  }

  async create(dto: CreateChecklistDto, reviewerUserId: number) {
    if (!reviewerUserId) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar la lista de chequeo",
        errors: ["No se pudo identificar al coordinador"],
      });
    }

    await this.ensureDefaultTemplates();

    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      select: {
        id: true,
        status: true,
        vehiclePlate: true,
      },
    });

    if (!trip) {
      throw new NotFoundException({
        success: false,
        message: "Viaje no encontrado",
      });
    }

    if (trip.status?.toUpperCase() !== "PENDING_CHECKLIST") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar la lista de chequeo",
        errors: ["Este viaje no esta pendiente de chequeo"],
      });
    }

    const existing = await this.prisma.checklist.findUnique({
      where: { tripId: dto.tripId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar la lista de chequeo",
        errors: ["Este viaje ya tiene una lista de chequeo"],
      });
    }

    const templates = await this.prisma.checklistTemplate.findMany({
      orderBy: { itemName: "asc" },
    });

    const templateMap = new Map(
      templates.map((item) => [item.itemName.trim().toLowerCase(), item]),
    );
    const requiredTemplates = templates.filter((item) => item.required);

    const invalidItems: string[] = [];
    const inputItems = dto.items.map((item) => ({
      ...item,
      itemName: item.itemName.trim(),
      key: item.itemName.trim().toLowerCase(),
    }));

    for (const item of inputItems) {
      if (!templateMap.has(item.key)) {
        invalidItems.push(item.itemName);
      }
    }

    const missingRequired = requiredTemplates
      .filter((template) =>
        !inputItems.some((item) => item.key === template.itemName.trim().toLowerCase()),
      )
      .map((template) => template.itemName);

    if (invalidItems.length || missingRequired.length) {
      const errors: string[] = [];
      if (invalidItems.length) {
        errors.push(
          `Items no validos: ${invalidItems.join(", ")}`,
        );
      }
      if (missingRequired.length) {
        errors.push(
          `Falta revisar: ${missingRequired.join(", ")}`,
        );
      }

      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar la lista de chequeo",
        errors,
      });
    }

    const failedRequired = inputItems.filter((item) => {
      const template = templateMap.get(item.key);
      return template?.required && !item.passed;
    });

    const status = failedRequired.length ? "REJECTED" : "APPROVED";

    return this.prisma.$transaction(async (tx) => {
      const checklist = await tx.checklist.create({
        data: {
          tripId: trip.id,
          vehiclePlate: trip.vehiclePlate,
          reviewedByUserId: reviewerUserId,
          status,
          generalObservations: dto.generalObservations,
        },
      });

      await tx.checklistItem.createMany({
        data: inputItems.map((item) => ({
          checklistId: checklist.id,
          itemName: item.itemName,
          passed: item.passed,
          observations: item.observations,
        })),
      });

      if (status === "APPROVED") {
        await tx.trip.update({
          where: { id: trip.id },
          data: { status: "ENABLED" },
        });
      }

      return tx.checklist.findUnique({
        where: { id: checklist.id },
        include: { items: true },
      });
    });
  }

  async findOne(id: number) {
    const checklist = await this.prisma.checklist.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!checklist) {
      throw new NotFoundException({
        success: false,
        message: "Lista de chequeo no encontrada",
      });
    }

    return checklist;
  }

  async findByTrip(tripId: number) {
    const checklist = await this.prisma.checklist.findUnique({
      where: { tripId },
      include: { items: true },
    });

    if (!checklist) {
      throw new NotFoundException({
        success: false,
        message: "No hay lista de chequeo para este viaje",
      });
    }

    return checklist;
  }

  async findByVehicle(plate: string) {
    return this.prisma.checklist.findMany({
      where: { vehiclePlate: plate.trim().toUpperCase() },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }

  private async ensureDefaultTemplates() {
    const count = await this.prisma.checklistTemplate.count();
    if (count > 0) return;

    await this.prisma.checklistTemplate.createMany({
      data: this.defaultTemplateItems.map((itemName) => ({
        itemName,
        required: true,
        status: "ACTIVE",
      })),
    });
  }
}
