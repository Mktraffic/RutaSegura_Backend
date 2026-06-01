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
        status: "ACTIVE",
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

  async findAvailableGuardians() {
    // Acudientes activos que aún no tienen usuario de acceso.
    return this.prisma.guardian.findMany({
      where: {
        NOT: { status: { equals: "INACTIVE", mode: "insensitive" } },
        OR: [{ personId: null }, { loginPerson: { users: { none: {} } } }],
      },
      orderBy: [{ firstName: "asc" }, { firstLastname: "asc" }],
      select: {
        id: true,
        firstName: true,
        middleName: true,
        firstLastname: true,
        secondLastname: true,
        email: true,
      },
    });
  }

  async create(dto: CreateUserDto) {
    // Alta de acudiente: se crea/enlaza la persona de login del Guardian.
    if (dto.guardianId) {
      return this.createGuardianUser(dto);
    }

    if (!dto.personId) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el usuario",
        errors: ["Debes indicar la persona asociada"],
      });
    }

    await this.validateCreateBusinessRules(dto);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
      select: { name: true },
    });

    if (!role) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el usuario",
        errors: ["El rol indicado no existe"],
      });
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        personId: dto.personId,
        roleId: dto.roleId,
        pickupEnabled: this.resolvePickupEnabledByRole(role.name, dto.pickupEnabled),
        status: "ACTIVE",
      },
      select: this.userSelect,
    });
  }

  // Crea el usuario de acceso de un acudiente: reutiliza/crea su persona de
  // login (personType GUARDIAN), la enlaza al Guardian y crea el User.
  private async createGuardianUser(dto: CreateUserDto) {
    const errors: string[] = [];

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existingEmail) {
      errors.push("Ya existe un usuario con ese email");
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
      select: { id: true, name: true },
    });
    if (!role) {
      errors.push("El rol indicado no existe");
    } else if (role.name.toUpperCase() !== "GUARDIAN") {
      errors.push("El rol seleccionado no corresponde a un acudiente");
    }

    const guardian = await this.prisma.guardian.findUnique({
      where: { id: dto.guardianId },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        firstLastname: true,
        secondLastname: true,
        phone: true,
        email: true,
        status: true,
        personId: true,
        loginPerson: { select: { users: { select: { id: true } } } },
      },
    });
    if (!guardian) {
      errors.push("El acudiente indicado no existe");
    } else {
      if (guardian.status?.toUpperCase() === "INACTIVE") {
        errors.push("El acudiente está inactivo");
      }
      if (guardian.personId && (guardian.loginPerson?.users.length ?? 0) > 0) {
        errors.push("El acudiente ya tiene un usuario de acceso");
      }
    }

    if (errors.length || !guardian) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el usuario",
        errors: errors.length ? errors : ["El acudiente indicado no existe"],
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // Reutiliza la persona de login si ya existe, si no la crea.
      let loginPersonId = guardian.personId ?? null;
      if (loginPersonId) {
        const exists = await tx.person.findUnique({
          where: { id: loginPersonId },
          select: { id: true },
        });
        if (!exists) loginPersonId = null;
      }

      if (!loginPersonId) {
        const person = await tx.person.create({
          data: {
            personType: "GUARDIAN",
            firstName: guardian.firstName,
            middleName: guardian.middleName,
            firstLastname: guardian.firstLastname,
            secondLastname: guardian.secondLastname,
            phone: guardian.phone,
            email: guardian.email,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        loginPersonId = person.id;
      }

      await tx.guardian.update({
        where: { id: guardian.id },
        data: { personId: loginPersonId },
      });

      return tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          personId: loginPersonId,
          roleId: dto.roleId,
          pickupEnabled: false,
          status: "ACTIVE",
        },
        select: this.userSelect,
      });
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

    const effectiveRoleName = dto.roleId
      ? (
          await this.prisma.role.findUnique({
            where: { id: dto.roleId },
            select: { name: true },
          })
        )?.name
      : current.role.name;

    if (dto.roleId && !effectiveRoleName) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar el usuario",
        errors: ["El rol indicado no existe"],
      });
    }

    const roleNameForUpdate = effectiveRoleName ?? current.role.name;

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
        pickupEnabled: this.resolvePickupEnabledByRole(
          roleNameForUpdate,
          dto.pickupEnabled,
          current.pickupEnabled,
        ),
        status: dto.status,
      },
      select: this.userSelect,
    });

    if (dto.roleId || dto.personId) {
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
    const personId = dto.personId as number; // create() ya garantizó que existe

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existingEmail) {
      errors.push("Ya existe un usuario con ese email");
    }

    const person = await this.prisma.person.findUnique({
      where: { id: personId },
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
      where: { personId },
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
        pickupEnabled: true,
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

    if (role === "ADMIN" && type !== "COORDINATOR") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear/actualizar el usuario",
        errors: [
          "La persona debe ser de tipo COORDINATOR para el rol ADMIN",
        ],
      });
    }

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

    if (role === "GUARDIAN" && type !== "GUARDIAN") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear/actualizar el usuario",
        errors: ["La persona debe ser de tipo GUARDIAN para el rol acudiente"],
      });
    }
  }

  private resolvePickupEnabledByRole(
    roleName: string,
    requestedPickup?: boolean,
    currentPickup = false,
  ) {
    const role = roleName.toUpperCase();

    if (role !== "DRIVER") {
      return false;
    }

    if (typeof requestedPickup === "boolean") {
      return requestedPickup;
    }

    return currentPickup;
  }
}
