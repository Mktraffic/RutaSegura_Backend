import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RequestUser } from "../auth/interfaces/jwt-payload.interface";
import { CreateVehicleDto, UpdateVehicleDto } from "./dto/vehicle.dto";
import { VehiclesService } from "./vehicles.service";

@Controller("vehicles")
@Roles("admin", "coordinator", "coordinador")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateVehicleDto) {
    const vehicle = await this.vehiclesService.create(dto);
    return {
      success: true,
      message: "Vehiculo registrado correctamente",
      data: vehicle,
    };
  }

  @Get()
  async findAll(@Query("q") query?: string) {
    const vehicles = await this.vehiclesService.findAll(query?.trim() || undefined);
    return {
      success: true,
      message: "Listado de vehiculos",
      data: vehicles,
    };
  }

  @Get(":plate")
  async findOne(@Param("plate") plate: string) {
    const vehicle = await this.vehiclesService.findOne(plate);
    return {
      success: true,
      message: "Detalle del vehiculo",
      data: vehicle,
    };
  }

  @Patch(":plate")
  async update(@Param("plate") plate: string, @Body() dto: UpdateVehicleDto) {
    const vehicle = await this.vehiclesService.update(plate, dto);
    return {
      success: true,
      message: "Vehiculo actualizado correctamente",
      data: vehicle,
    };
  }

  @Delete(":plate")
  async inactivate(
    @Param("plate") plate: string,
    @CurrentUser() user?: RequestUser,
  ) {
    const vehicle = await this.vehiclesService.inactivate(plate, user?.email);
    return {
      success: true,
      message: "Vehiculo inactivado correctamente",
      data: vehicle,
    };
  }
}
