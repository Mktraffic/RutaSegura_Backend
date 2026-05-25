import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CreateRouteAssignmentDto,
  CreateRouteDto,
  UpdateRouteAssignmentDto,
  UpdateRouteDto,
} from "./dto/route.dto";
import { RoutesService } from "./routes.service";

@Controller("routes")
@Roles("admin", "coordinator", "coordinador")
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRouteDto) {
    const route = await this.routesService.create(dto);
    return {
      success: true,
      message: "Ruta registrada correctamente",
      data: route,
    };
  }

  @Get()
  async findAll(
    @Query("q") query?: string,
    @Query("status") status?: string,
    @Query("zoneId") zoneId?: string,
  ) {
    const routes = await this.routesService.findAll(
      query?.trim() || undefined,
      status?.trim() || undefined,
      zoneId ? Number(zoneId) : undefined,
    );
    return {
      success: true,
      message: "Listado de rutas",
      data: routes,
    };
  }

  @Get("form-options")
  async getFormOptions() {
    const options = await this.routesService.getFormOptions();
    return {
      success: true,
      message: "Opciones para el formulario de rutas",
      data: options,
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const route = await this.routesService.findOne(Number(id));
    return {
      success: true,
      message: "Detalle de la ruta",
      data: route,
    };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateRouteDto) {
    const route = await this.routesService.update(Number(id), dto);
    return {
      success: true,
      message: "Ruta actualizada correctamente",
      data: route,
    };
  }

  @Patch(":id/activate")
  async activate(@Param("id") id: string) {
    const route = await this.routesService.activate(Number(id));
    return {
      success: true,
      message: "Ruta activada correctamente",
      data: route,
    };
  }

  @Delete(":id")
  async inactivate(@Param("id") id: string) {
    const route = await this.routesService.inactivate(Number(id));
    return {
      success: true,
      message: "Ruta inactivada correctamente",
      data: route,
    };
  }

  @Get(":id/assignments")
  async listAssignments(@Param("id") id: string) {
    const assignments = await this.routesService.listAssignments(Number(id));
    return {
      success: true,
      message: "Listado de asignaciones",
      data: assignments,
    };
  }

  @Post(":id/assignments")
  @HttpCode(HttpStatus.CREATED)
  async createAssignment(
    @Param("id") id: string,
    @Body() dto: CreateRouteAssignmentDto,
  ) {
    const assignment = await this.routesService.createAssignment(
      Number(id),
      dto,
    );
    return {
      success: true,
      message: "Asignacion creada correctamente",
      data: assignment,
    };
  }

  @Patch(":id/assignments/:assignmentId")
  async updateAssignment(
    @Param("id") id: string,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: UpdateRouteAssignmentDto,
  ) {
    const assignment = await this.routesService.updateAssignment(
      Number(id),
      Number(assignmentId),
      dto,
    );
    return {
      success: true,
      message: "Asignacion actualizada correctamente",
      data: assignment,
    };
  }

  @Delete(":id/assignments/:assignmentId")
  async inactivateAssignment(
    @Param("id") id: string,
    @Param("assignmentId") assignmentId: string,
  ) {
    const assignment = await this.routesService.inactivateAssignment(
      Number(id),
      Number(assignmentId),
    );
    return {
      success: true,
      message: "Asignacion inactivada correctamente",
      data: assignment,
    };
  }

  @Post(":id/calculate")
  async calculateRoute(@Param("id") id: string) {
    const route = await this.routesService.calculateRoute(Number(id));
    return {
      success: true,
      message: "Ruta calculada correctamente",
      data: route,
    };
  }

  @Get(":id/geojson")
  async getRouteGeoJson(@Param("id") id: string) {
    const data = await this.routesService.getRouteGeoJson(Number(id));
    return {
      success: true,
      message: "Geometria de la ruta",
      data,
    };
  }

  @Get(":id/google-maps")
  async getRouteGoogleMapsUrl(@Param("id") id: string) {
    const url = await this.routesService.getRouteGoogleMapsUrl(Number(id));
    return {
      success: true,
      message: "URL de Google Maps",
      data: { url },
    };
  }

  @Get(":id/gpx")
  @Header("Content-Type", "application/gpx+xml")
  @Header("Content-Disposition", "attachment; filename=route.gpx")
  async exportRouteGpx(@Param("id") id: string) {
    return this.routesService.exportRouteGpx(Number(id));
  }
}
