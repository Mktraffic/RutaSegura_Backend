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
import { CreateGuardianDto, UpdateGuardianDto } from "./dto/create-guardian.dto";
import { GuardiansService } from "./guardians.service";

@Controller("guardians")
@Roles("admin", "coordinator", "coordinador")
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  async findAll(@Query("q") query?: string) {
    const guardians = await this.guardiansService.findAll(query?.trim() || undefined);
    return {
      success: true,
      message: "Listado de acudientes",
      data: guardians,
    };
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const guardian = await this.guardiansService.findOne(id);
    return {
      success: true,
      message: "Detalle del acudiente",
      data: guardian,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateGuardianDto) {
    const guardian = await this.guardiansService.create(dto);
    return {
      success: true,
      message: "Acudiente creado correctamente",
      data: guardian,
    };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateGuardianDto,
  ) {
    const guardian = await this.guardiansService.update(id, dto);
    return {
      success: true,
      message: "Acudiente actualizado correctamente",
      data: guardian,
    };
  }

  @Delete(":id")
  async inactivate(@Param("id", ParseIntPipe) id: number) {
    const guardian = await this.guardiansService.inactivate(id);
    return {
      success: true,
      message: "Acudiente inactivado correctamente",
      data: guardian,
    };
  }
}