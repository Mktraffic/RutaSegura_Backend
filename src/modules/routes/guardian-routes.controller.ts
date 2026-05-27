import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import { RoutesService } from "./routes.service";

// Portal del acudiente: ve las rutas asignadas a sus hijos.
@Controller("guardian/routes")
@Roles("guardian", "acudiente")
export class GuardianRoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  async findChildrenRoutes(@CurrentUser() user: RequestUser) {
    const data = await this.routesService.findChildrenRoutesForGuardian(
      user.personId,
    );
    return {
      success: true,
      message: "Rutas de tus hijos",
      data,
    };
  }
}
