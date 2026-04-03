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
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

@Controller("users")
@Roles("admin", "coordinator", "coordinador")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return {
      success: true,
      message: "Usuario creado correctamente",
      data: user,
    };
  }

  @Get()
  async findAll(@Query("q") query?: string) {
    const users = await this.usersService.findAll(query?.trim() || undefined);
    return {
      success: true,
      message: "Listado de usuarios",
      data: users,
    };
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      message: "Detalle del usuario",
      data: user,
    };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, dto);
    return {
      success: true,
      message: "Usuario actualizado correctamente",
      data: user,
    };
  }

  @Delete(":id")
  async inactivate(@Param("id", ParseIntPipe) id: number) {
    const user = await this.usersService.inactivate(id);
    return {
      success: true,
      message: "Usuario inactivado correctamente",
      data: user,
    };
  }
}
