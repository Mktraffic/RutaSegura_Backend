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
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateStudentDto, UpdateStudentDto } from "./dto/student.dto";
import { StudentsService } from "./students.service";

@Controller("students")
@Roles("coordinator", "coordinador")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateStudentDto) {
    const student = await this.studentsService.create(dto);
    return {
      success: true,
      message: "Estudiante registrado correctamente",
      data: student,
    };
  }

  @Get()
  async findAll() {
    const students = await this.studentsService.findAll();
    return {
      success: true,
      message: "Listado de estudiantes",
      data: students,
    };
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const student = await this.studentsService.findOne(id);
    return {
      success: true,
      message: "Detalle del estudiante",
      data: student,
    };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
  ) {
    const student = await this.studentsService.update(id, dto);
    return {
      success: true,
      message: "Estudiante actualizado correctamente",
      data: student,
    };
  }

  @Delete(":id")
  async inactivate(@Param("id", ParseIntPipe) id: number) {
    const student = await this.studentsService.inactivate(id);
    return {
      success: true,
      message: "Estudiante inactivado correctamente",
      data: student,
    };
  }
}