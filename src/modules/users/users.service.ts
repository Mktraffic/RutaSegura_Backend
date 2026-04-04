import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly roleSelect = {
    id: true,
    name: true,
  } satisfies Prisma.RoleSelect;

  private readonly personSelect = {
    id: true,
    personType: true,
    firstName: true,
    middleName: true,
    firstLastname: true,
    secondLastname: true,
    email: true,
    status: true,
  } satisfies Prisma.PersonSelect;

  private readonly userSelect = {
    id: true,
    email: true,
    status: true,
    pickupEnabled: true,
    createdAt: true,
    role: {
      select: this.roleSelect,
    },
    person: {
      select: this.personSelect,
    },
  } satisfies Prisma.UserSelect;

  async findRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" },
      select: this.roleSelect,
    });
  }

  async findAvailablePersons(query?: string) {
    return this.prisma.person.findMany({
      where: {
        users: { none: {} },
        personType: { in: ["DRIVER", "COORDINATOR"] },
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { middleName: { contains: query, mode: "insensitive" } },
                { firstLastname: { contains: query, mode: "insensitive" } },
                { secondLastname: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ firstName: "asc" }, { firstLastname: "asc" }],
      select: this.personSelect,
    });
  }

  async create(dto: CreateUserDto) {
    await this.validateCreateBusinessRules(dto);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        personId: dto.personId,
        roleId: dto.roleId,
        pickupEnabled: dto.pickupEnabled ?? false,
        status: "ACTIVE",
      },
      select: this.userSelect,
    });
  }

  async findAll(query?: string) {
    return this.prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              {
                person: {
                  firstName: { contains: query, mode: "insensitive" },
                },
              },
              {
                person: {
                  firstLastname: { contains: query, mode: "insensitive" },
                },
              },
              {
                role: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : undefined,
      orderBy: { id: "desc" },
      select: this.userSelect,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const current = await this.ensureUserExists(id);
    await this.validateUpdateBusinessRules(id, dto);

    const hashedPassword = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        password: hashedPassword,
        personId: dto.personId,
        roleId: dto.roleId,
        pickupEnabled: dto.pickupEnabled,
        status: dto.status,
      },
      select: this.userSelect,
    });

    if (
      (dto.roleId || dto.personId) &&
      current.role.name !== updated.role.name
    ) {
      await this.ensureRoleMatchesPersonType(
        updated.role.name,
        updated.person.personType,
      );
    }

    return updated;
  }

  async inactivate(id: number) {
    const current = await this.ensureUserExists(id);

    if (current.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar el usuario",
        errors: ["El usuario ya se encuentra inactivo"],
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: this.userSelect,
    });
  }

  private async validateCreateBusinessRules(dto: CreateUserDto) {
    const errors: string[] = [];

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existingEmail) {
      errors.push("Ya existe un usuario con ese email");
    }

    const person = await this.prisma.person.findUnique({
      where: { id: dto.personId },
      select: { id: true, personType: true, status: true },
    });
    if (!person) {
      errors.push("La persona indicada no existe");
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
      select: { id: true, name: true },
    });
    if (!role) {
      errors.push("El rol indicado no existe");
    }

    const existingByPerson = await this.prisma.user.findFirst({
      where: { personId: dto.personId },
      select: { id: true },
    });
    if (existingByPerson) {
      errors.push("La persona indicada ya tiene un usuario asociado");
    }

    if (person && role) {
      this.ensureRoleMatchesPersonType(role.name, person.personType);
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el usuario",
        errors,
      });
    }
  }

  private async validateUpdateBusinessRules(id: number, dto: UpdateUserDto) {
    const errors: string[] = [];

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (existingEmail && existingEmail.id !== id) {
        errors.push("Ya existe un usuario con ese email");
      }
    }

    if (dto.personId) {
      const person = await this.prisma.person.findUnique({
        where: { id: dto.personId },
        select: { id: true },
      });
      if (!person) {
        errors.push("La persona indicada no existe");
      }

      const existingByPerson = await this.prisma.user.findFirst({
        where: {
          personId: dto.personId,
          id: { not: id },
        },
        select: { id: true },
      });
      if (existingByPerson) {
        errors.push("La persona indicada ya tiene un usuario asociado");
      }
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
        select: { id: true },
      });
      if (!role) {
        errors.push("El rol indicado no existe");
      }
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar el usuario",
        errors,
      });
    }
  }

  private async ensureUserExists(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        role: { select: { name: true } },
        person: { select: { personType: true } },
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    return user;
  }

  private ensureRoleMatchesPersonType(roleName: string, personType: string) {
    const role = roleName.toUpperCase();
    const type = personType.toUpperCase();

    if (role === "COORDINATOR" && type !== "COORDINATOR") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear/actualizar el usuario",
        errors: [
          "La persona debe ser de tipo COORDINATOR para el rol COORDINATOR",
        ],
      });
    }

    if (role === "DRIVER" && type !== "DRIVER") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear/actualizar el usuario",
        errors: ["La persona debe ser de tipo DRIVER para el rol DRIVER"],
      });
    }
  }
}
