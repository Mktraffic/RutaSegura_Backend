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
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateTripDto } from "./dto/trip.dto";
import { TripsService } from "./trips.service";

@Controller("trips")
@Roles("admin", "coordinator", "coordinador")
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTripDto) {
    const trip = await this.tripsService.create(dto);
    return {
      success: true,
      message: "Viaje registrado correctamente",
      data: trip,
    };
  }

  @Get()
  async findAll(
    @Query("routeId") routeId?: string,
    @Query("status") status?: string,
    @Query("vehiclePlate") vehiclePlate?: string,
    @Query("driverPersonId") driverPersonId?: string,
    @Query("tripDate") tripDate?: string,
  ) {
    const trips = await this.tripsService.findAll({
      routeId: routeId ? Number(routeId) : undefined,
      status: status?.trim() || undefined,
      vehiclePlate: vehiclePlate?.trim() || undefined,
      driverPersonId: driverPersonId ? Number(driverPersonId) : undefined,
      tripDate: tripDate?.trim() || undefined,
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

  @Patch(":id/enable")
  async enable(@Param("id", ParseIntPipe) id: number) {
    const trip = await this.tripsService.enable(id);
    return {
      success: true,
      message: "Viaje habilitado correctamente",
      data: trip,
    };
  }
}
