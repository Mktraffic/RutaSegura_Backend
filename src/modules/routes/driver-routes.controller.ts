import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import { RoutesService } from "./routes.service";

// Portal del conductor: solo accede a las rutas que tiene asignadas.
@Controller("driver/routes")
@Roles("driver", "conductor")
export class DriverRoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  async findMine(@CurrentUser() user: RequestUser) {
    const routes = await this.routesService.findRoutesForDriver(user.personId);
    return {
      success: true,
      message: "Listado de tus rutas asignadas",
      data: routes,
    };
  }

  @Get(":id")
  async findOne(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const route = await this.routesService.findRouteForDriver(
      id,
      user.personId,
    );
    return {
      success: true,
      message: "Detalle de la ruta",
      data: route,
    };
  }

  @Get(":id/google-maps")
  async getGoogleMapsUrl(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const url = await this.routesService.getDriverRouteGoogleMapsUrl(
      id,
      user.personId,
    );
    return {
      success: true,
      message: "URL de Google Maps",
      data: { url },
    };
  }

  @Get(":id/geojson")
  async getGeoJson(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
  ) {
    const data = await this.routesService.getDriverRouteGeoJson(
      id,
      user.personId,
    );
    return {
      success: true,
      message: "Geometria de la ruta",
      data,
    };
  }
}
