import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateGuardianDto } from "./dto/create-guardian.dto";
import { GuardiansService } from "./guardians.service";

@Controller("guardians")
@Roles("admin", "coordinator", "coordinador")
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

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