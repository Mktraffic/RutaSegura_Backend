import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export type TripNotificationContext = {
  tripId: number;
  routeName: string;
  driverName: string;
  tripDate: string; // YYYY-MM-DD
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Notifica a TODOS los gestores activos (coordinador/admin) que un conductor
  // envió el preoperacional y hay un viaje pendiente de revisión.
  async notifyTripSubmittedForReview(ctx: TripNotificationContext) {
    const managers = await this.prisma.user.findMany({
      where: {
        status: { equals: "ACTIVE", mode: "insensitive" },
        role: { name: { in: ["COORDINATOR", "ADMIN"], mode: "insensitive" } },
      },
      select: { id: true },
    });

    if (!managers.length) return;

    await this.prisma.notification.createMany({
      data: managers.map((manager) => ({
        userId: manager.id,
        type: "TRIP_REVIEW",
        title: "Preoperacional pendiente de revisión",
        message: `${ctx.driverName} envió el preoperacional de la ruta "${ctx.routeName}" (${ctx.tripDate}). Revísalo para habilitar el viaje.`,
        tripId: ctx.tripId,
      })),
    });
  }

  // Notifica al conductor que su viaje fue aprobado o rechazado.
  async notifyTripReviewed(
    driverPersonId: number,
    ctx: TripNotificationContext,
    approved: boolean,
    reviewNotes?: string | null,
  ) {
    const driverUsers = await this.prisma.user.findMany({
      where: { personId: driverPersonId },
      select: { id: true },
    });

    if (!driverUsers.length) return;

    const title = approved
      ? "Viaje habilitado"
      : "Preoperacional rechazado";
    const baseMessage = approved
      ? `Tu preoperacional de la ruta "${ctx.routeName}" (${ctx.tripDate}) fue aprobado. Ya puedes iniciar el viaje.`
      : `Tu preoperacional de la ruta "${ctx.routeName}" (${ctx.tripDate}) fue rechazado. Corrígelo y vuelve a enviarlo.`;
    const message = reviewNotes
      ? `${baseMessage} Observación: ${reviewNotes}`
      : baseMessage;

    await this.prisma.notification.createMany({
      data: driverUsers.map((user) => ({
        userId: user.id,
        type: approved ? "TRIP_APPROVED" : "TRIP_REJECTED",
        title,
        message,
        tripId: ctx.tripId,
      })),
    });
  }

  async findForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async unreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(userId: number, id: number) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
    return { id };
  }

  async markAllRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }
}
