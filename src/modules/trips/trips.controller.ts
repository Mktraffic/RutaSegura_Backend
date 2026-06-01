import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import {
  CancelTripDto,
  CreateTripDto,
  ReviewTripDto,
} from "./dto/trip.dto";
import { TripsService } from "./trips.service";

// Gestión de viajes para coordinador/admin: programar, listar/filtrar,
// y revisar (aprobar/rechazar) el preoperacional.
@Controller("trips")
@Roles("admin", "coordinator", "coordinador")
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateTripDto,
  ) {
    const trip = await this.tripsService.create(dto, user.userId);
    return {
      success: true,
      message: "Viaje programado correctamente",
      data: trip,
    };
  }

  @Get()
  async findAll(
    @Query("status") status?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("routeId") routeId?: string,
    @Query("driverPersonId") driverPersonId?: string,
  ) {
    const trips = await this.tripsService.findAll({
      status: status?.trim() || undefined,
      from: from?.trim() || undefined,
      to: to?.trim() || undefined,
      routeId: routeId ? Number(routeId) : undefined,
      driverPersonId: driverPersonId ? Number(driverPersonId) : undefined,
    });
    return {
      success: true,
      message: "Listado de viajes",
      data: trips,
    };
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const trip = await this.tripsService.findOne(id);
    return {
      success: true,
      message: "Detalle del viaje",
      data: trip,
    };
  }

  @Patch(":id/approve")
  async approve(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReviewTripDto,
  ) {
    const trip = await this.tripsService.approve(id, user.userId, dto);
    return {
      success: true,
      message: "Viaje aprobado y habilitado",
      data: trip,
    };
  }

  @Patch(":id/reject")
  async reject(
    @CurrentUser() user: RequestUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ReviewTripDto,
  ) {
    const trip = await this.tripsService.reject(id, user.userId, dto);
    return {
      success: true,
      message: "Preoperacional rechazado",
      data: trip,
    };
  }

  @Patch(":id/cancel")
  async cancel(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CancelTripDto,
  ) {
    const trip = await this.tripsService.cancel(id, dto);
    return {
      success: true,
      message: "Viaje cancelado",
      data: trip,
    };
  }
}
