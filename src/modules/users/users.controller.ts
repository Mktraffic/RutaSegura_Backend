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
@Roles("admin")
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

  @Get("catalog/roles")
  async findRoles() {
    const roles = await this.usersService.findRoles();
    return {
      success: true,
      message: "Listado de roles",
      data: roles,
    };
  }

  @Get("catalog/persons")
  async findAvailablePersons(@Query("q") query?: string) {
    const persons = await this.usersService.findAvailablePersons(
      query?.trim() || undefined,
    );
    return {
      success: true,
      message: "Listado de personas disponibles",
      data: persons,
    };
  }

  @Get("catalog/available-guardians")
  async findAvailableGuardians() {
    const guardians = await this.usersService.findAvailableGuardians();
    return {
      success: true,
      message: "Acudientes sin usuario de acceso",
      data: guardians,
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
