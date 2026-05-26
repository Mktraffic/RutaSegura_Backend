import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateChecklistDto } from "./dto/checklist.dto";
import { ChecklistsService } from "./checklists.service";

@Controller("checklists")
@Roles("admin", "coordinator", "coordinador")
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get("templates")
  async findTemplates() {
    const data = await this.checklistsService.findTemplates();
    return {
      success: true,
      message: "Listado de items de chequeo",
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateChecklistDto, @CurrentUser() user: { userId?: number }) {
    const checklist = await this.checklistsService.create(dto, Number(user?.userId));
    return {
      success: true,
      message: "Lista de chequeo registrada correctamente",
      data: checklist,
    };
  }

  @Get("trip/:tripId")
  async findByTrip(@Param("tripId", ParseIntPipe) tripId: number) {
    const checklist = await this.checklistsService.findByTrip(tripId);
    return {
      success: true,
      message: "Detalle de la lista de chequeo",
      data: checklist,
    };
  }

  @Get("vehicle/:plate")
  async findByVehicle(@Param("plate") plate: string) {
    const data = await this.checklistsService.findByVehicle(plate);
    return {
      success: true,
      message: "Listado de chequeos del vehiculo",
      data,
    };
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const checklist = await this.checklistsService.findOne(id);
    return {
      success: true,
      message: "Detalle de la lista de chequeo",
      data: checklist,
    };
  }

  @Get()
  async findAllByVehicle(@Query("vehiclePlate") plate?: string) {
    if (!plate) {
      return {
        success: true,
        message: "Listado de chequeos",
        data: [],
      };
    }

    const data = await this.checklistsService.findByVehicle(plate);
    return {
      success: true,
      message: "Listado de chequeos del vehiculo",
      data,
    };
  }
}
