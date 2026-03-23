import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateGuardianDto } from "./dto/create-guardian.dto";
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
}