import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateStudentDto, UpdateStudentDto } from "./dto/student.dto";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    await this.validateCreateBusinessRules(dto);

    const student = await this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          personType: "STUDENT",
          guardianId: dto.guardianId,
          firstName: dto.firstName,
          middleName: dto.middleName,
          firstLastname: dto.firstLastname,
          secondLastname: dto.secondLastname,
          phone: dto.phone,
          email: dto.email,
          status: "ACTIVE",
        },
      });

      const document = await tx.personDocument.create({
        data: {
          documentType: dto.document.documentType,
          documentNumber: dto.document.documentNumber,
          description: dto.document.description,
          status: "ACTIVE",
        },
      });

      if (dto.document.createPersonDocumentLink) {
        await tx.personDocumentLink.create({
          data: {
            personId: person.id,
            personDocumentId: document.id,
            documentRole: dto.document.documentRole ?? "student",
          },
        });
      }

      await this.syncAddresses(tx, person.id, dto.addresses);
      return this.findOneByIdInternal(tx, person.id);
    });

    return student;
  }

  async findAll() {
    return this.prisma.person.findMany({
      where: {
        personType: "STUDENT",
      },
      orderBy: { id: "desc" },
      select: this.studentSelect,
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.person.findFirst({
      where: {
        id,
        personType: "STUDENT",
      },
      select: this.studentSelect,
    });

    if (!student) {
      throw new NotFoundException({
        success: false,
        message: "Estudiante no encontrado",
      });
    }

    return student;
  }

  async update(id: number, dto: UpdateStudentDto) {
    await this.ensureStudentExists(id);
    await this.validateUpdateBusinessRules(dto);

    const student = await this.prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id },
        data: {
          guardianId: dto.guardianId,
          firstName: dto.firstName,
          middleName: dto.middleName,
          firstLastname: dto.firstLastname,
          secondLastname: dto.secondLastname,
          phone: dto.phone,
          email: dto.email,
          status: dto.status,
        },
      });

      if (dto.document) {
        const document = await tx.personDocument.create({
          data: {
            documentType: dto.document.documentType,
            documentNumber: dto.document.documentNumber,
            description: dto.document.description,
            status: "ACTIVE",
          },
        });

        if (dto.document.createPersonDocumentLink) {
          await tx.personDocumentLink.create({
            data: {
              personId: id,
              personDocumentId: document.id,
              documentRole: dto.document.documentRole ?? "student",
            },
          });
        }
      }

      if (dto.addresses) {
        await tx.personAddress.deleteMany({ where: { personId: id } });
        await this.syncAddresses(tx, id, dto.addresses);
      }

      return this.findOneByIdInternal(tx, id);
    });

    return student;
  }

  async inactivate(id: number) {
    await this.ensureStudentExists(id);

    const student = await this.prisma.person.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: this.studentSelect,
    });

    return student;
  }

  private readonly studentSelect = {
    id: true,
    guardianId: true,
    firstName: true,
    middleName: true,
    firstLastname: true,
    secondLastname: true,
    phone: true,
    email: true,
    status: true,
    createdAt: true,
    guardian: {
      select: {
        id: true,
        firstName: true,
        firstLastname: true,
        email: true,
      },
    },
    personAddresses: {
      select: {
        id: true,
        address: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
            status: true,
          },
        },
      },
    },
    personDocumentLinks: {
      select: {
        id: true,
        documentRole: true,
        personDocument: {
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            status: true,
          },
        },
      },
    },
  } satisfies Prisma.PersonSelect;

  private async syncAddresses(
    tx: Prisma.TransactionClient,
    personId: number,
    addresses: Array<{ address: string; latitude: number; longitude: number }>,
  ) {
    for (const item of addresses) {
      const existingAddress = await tx.address.findFirst({
        where: {
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
        },
        select: { id: true },
      });

      const addressId = existingAddress
        ? existingAddress.id
        : (
            await tx.address.create({
              data: {
                address: item.address,
                latitude: item.latitude,
                longitude: item.longitude,
                status: "ACTIVE",
              },
              select: { id: true },
            })
          ).id;

      await tx.personAddress.create({
        data: {
          personId,
          addressId,
        },
      });
    }
  }

  private async validateCreateBusinessRules(dto: CreateStudentDto) {
    const errors: string[] = [];

    if (!dto.guardianId) errors.push("El estudiante debe tener un acudiente");
    if (!dto.document?.documentType)
      errors.push("El estudiante debe tener tipo de documento");
    if (!dto.document?.documentNumber)
      errors.push("El estudiante debe tener numero de documento");
    if (!dto.firstName) errors.push("El estudiante debe tener primer nombre");
    if (!dto.firstLastname)
      errors.push("El estudiante debe tener primer apellido");
    if (!dto.email) errors.push("El estudiante debe tener email");
    if (!dto.addresses?.length)
      errors.push("El estudiante debe tener al menos una direccion");

    const guardian = await this.prisma.guardian.findUnique({
      where: { id: dto.guardianId },
      select: { id: true },
    });
    if (!guardian) {
      errors.push("El acudiente indicado no existe");
    }

    const duplicateDoc = await this.prisma.personDocument.findFirst({
      where: {
        documentType: dto.document.documentType,
        documentNumber: dto.document.documentNumber,
      },
      select: { id: true },
    });
    if (duplicateDoc) {
      errors.push("Ya existe un documento con ese tipo y numero");
    }

    const duplicateEmail = await this.prisma.person.findFirst({
      where: { email: dto.email },
      select: { id: true },
    });
    if (duplicateEmail) {
      errors.push("Ya existe una persona con ese email");
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar el estudiante",
        errors,
      });
    }
  }

  private async validateUpdateBusinessRules(dto: UpdateStudentDto) {
    const errors: string[] = [];

    if (dto.guardianId) {
      const guardian = await this.prisma.guardian.findUnique({
        where: { id: dto.guardianId },
        select: { id: true },
      });
      if (!guardian) {
        errors.push("El acudiente indicado no existe");
      }
    }

    if (dto.document) {
      const duplicateDoc = await this.prisma.personDocument.findFirst({
        where: {
          documentType: dto.document.documentType,
          documentNumber: dto.document.documentNumber,
        },
        select: { id: true },
      });
      if (duplicateDoc) {
        errors.push("Ya existe un documento con ese tipo y numero");
      }
    }

    if (errors.length) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar el estudiante",
        errors,
      });
    }
  }

  private async ensureStudentExists(id: number) {
    const student = await this.prisma.person.findFirst({
      where: {
        id,
        personType: "STUDENT",
      },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException({
        success: false,
        message: "Estudiante no encontrado",
      });
    }
  }

  private findOneByIdInternal(tx: Prisma.TransactionClient, id: number) {
    return tx.person.findFirst({
      where: {
        id,
        personType: "STUDENT",
      },
      select: this.studentSelect,
    });
  }
}