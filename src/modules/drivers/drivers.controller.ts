import {
  Body,
  Controller,
  Delete,
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
import {
  CreateDriverDto,
  DriverLicenseDto,
  UpdateDriverDto,
} from "./dto/driver.dto";
import { DriversService } from "./drivers.service";

@Controller("drivers")
@Roles("admin", "coordinator", "coordinador")
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDriverDto) {
    const driver = await this.driversService.create(dto);
    return {
      success: true,
      message: "Conductor registrado correctamente",
      data: driver,
    };
  }

  @Get()
  async findAll(@Query("q") query?: string) {
    const drivers = await this.driversService.findAll(query?.trim() || undefined);
    return {
      success: true,
      message: "Listado de conductores",
      data: drivers,
    };
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const driver = await this.driversService.findOne(id);
    return {
      success: true,
      message: "Detalle del conductor",
      data: driver,
    };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateDriverDto,
  ) {
    const driver = await this.driversService.update(id, dto);
    return {
      success: true,
      message: "Conductor actualizado correctamente",
      data: driver,
    };
  }

  @Patch(":id/license")
  async upsertLicense(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: DriverLicenseDto,
  ) {
    const driver = await this.driversService.upsertLicense(id, dto);
    return {
      success: true,
      message: "Licencia del conductor guardada correctamente",
      data: driver,
    };
  }

  @Delete(":id")
  async inactivate(@Param("id", ParseIntPipe) id: number) {
    const driver = await this.driversService.inactivate(id);
    return {
      success: true,
      message: "Conductor inactivado correctamente",
      data: driver,
    };
  }
}
