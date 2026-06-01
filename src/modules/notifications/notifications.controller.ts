import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import { NotificationsService } from "./notifications.service";

// Centro de notificaciones in-app. Cada usuario solo ve y gestiona las suyas.
@Controller("notifications")
@Roles("admin", "coordinator", "coordinador", "driver", "conductor")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findMine(@CurrentUser() user: RequestUser) {
    const data = await this.notificationsService.findForUser(user.userId);
    return {
      success: true,
      message: "Tus notificaciones",
      data,
    };
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: RequestUser) {
    const count = await this.notificationsService.unreadCount(user.userId);
    return {
      success: true,
      message: "Notificaciones sin leer",
      data: { count },
    };
  }

  @Patch("read-all")
  async markAllRead(@CurrentUser() user: RequestUser) {
    const data = await this.notificationsService.markAllRead(user.userId);
    return {
      success: true,
      message: "Notificaciones marcadas como leídas",
      data,
    };
  }

  @Patch(":id/read")
  async markRead(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const data = await this.notificationsService.markRead(user.userId, id);
    return {
      success: true,
      message: "Notificación marcada como leída",
      data,
    };
  }
}
