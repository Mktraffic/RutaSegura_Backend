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

  // Delimitacion burda de Tunja para clasificar zonas por coordenadas.
  private readonly tunjaBounds = {
    minLat: 5.5,
    maxLat: 5.58,
    minLng: -73.39,
    maxLng: -73.33,
  };

  // Referencias aproximadas compartidas por el usuario.
  private readonly laRazaLat = 5.548;
  private readonly bosqueRepublicaLat = 5.536;

  async create(dto: CreateStudentDto) {
    await this.validateCreateBusinessRules(dto);

    const documentTypeId = await this.resolveDocumentTypeId(
      dto.document.documentType,
    );

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
          documentTypeId,
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

  async findActiveByZone(zoneId: number) {
    return this.prisma.person.findMany({
      where: {
        personType: "STUDENT",
        status: "ACTIVE",
        personAddresses: {
          some: {
            address: {
              zoneId,
            },
          },
        },
      },
      orderBy: { id: "desc" },
      select: this.buildStudentSelectByZone(zoneId),
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
    await this.validateUpdateBusinessRules(id, dto);

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
        const existingLink = await tx.personDocumentLink.findFirst({
          where: { personId: id },
          orderBy: { id: "asc" },
          select: { id: true, personDocumentId: true },
        });

        if (!existingLink) {
          throw new BadRequestException({
            success: false,
            message: "No se pudo actualizar el estudiante",
            errors: [
              "El estudiante no tiene documento asociado para actualizar",
            ],
          });
        }

        const currentDocument = await tx.personDocument.findUnique({
          where: { id: existingLink.personDocumentId },
          select: { documentTypeId: true },
        });

        if (!currentDocument) {
          throw new BadRequestException({
            success: false,
            message: "No se pudo actualizar el estudiante",
            errors: ["El documento asociado del estudiante no existe"],
          });
        }

        const documentTypeId = dto.document.documentType
          ? await this.resolveDocumentTypeId(dto.document.documentType)
          : currentDocument.documentTypeId;

        await tx.personDocument.update({
          where: { id: existingLink.personDocumentId },
          data: {
            documentTypeId,
            description: dto.document.description,
            status: "ACTIVE",
          },
        });
      }

      if (dto.addresses) {
        await this.reconcileAddresses(tx, id, dto.addresses);
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
        phone: true,
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
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
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
            documentType: {
              select: {
                id: true,
                name: true,
              },
            },
            documentNumber: true,
            status: true,
          },
        },
      },
    },
  } satisfies Prisma.PersonSelect;

  private buildStudentSelectByZone(zoneId: number) {
    return {
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
          phone: true,
        },
      },
      personAddresses: {
        where: {
          address: {
            zoneId,
          },
        },
        select: {
          id: true,
          address: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
              status: true,
              zone: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
              documentType: {
                select: {
                  id: true,
                  name: true,
                },
              },
              documentNumber: true,
              status: true,
            },
          },
        },
      },
    } satisfies Prisma.PersonSelect;
  }

  private async syncAddresses(
    tx: Prisma.TransactionClient,
    personId: number,
    addresses: Array<{ address: string; latitude: number; longitude: number }>,
  ) {
    for (const item of addresses) {
      const addressId = await this.getOrCreateAddressId(tx, item);

      await tx.personAddress.upsert({
        where: {
          personId_addressId: {
            personId,
            addressId,
          },
        },
        create: {
          personId,
          addressId,
        },
        update: {},
      });
    }
  }

  private async reconcileAddresses(
    tx: Prisma.TransactionClient,
    personId: number,
    addresses: Array<{ address: string; latitude: number; longitude: number }>,
  ) {
    const targetAddressIds: number[] = [];

    for (const item of addresses) {
      const addressId = await this.getOrCreateAddressId(tx, item);

      targetAddressIds.push(addressId);
    }

    const existingPersonAddresses = await tx.personAddress.findMany({
      where: { personId },
      select: {
        id: true,
        addressId: true,
        routeAssignments: {
          select: { id: true },
        },
      },
    });

    const uniqueTargetAddressIds = new Set(targetAddressIds);
    const existingAddressIdSet = new Set(existingPersonAddresses.map((item) => item.addressId));

    for (const item of existingPersonAddresses) {
      if (!uniqueTargetAddressIds.has(item.addressId)) {
        if (item.routeAssignments.length > 0) {
          throw new BadRequestException({
            success: false,
            message: "No se pudo actualizar el estudiante",
            errors: [
              "No puedes eliminar una direccion que tiene asignaciones de ruta activas o historicas",
            ],
          });
        }

        await tx.personAddress.delete({
          where: { id: item.id },
        });
      }
    }

    for (const addressId of uniqueTargetAddressIds) {
      if (!existingAddressIdSet.has(addressId)) {
        await tx.personAddress.create({
          data: {
            personId,
            addressId,
          },
        });
      }
    }
  }

  private async getOrCreateAddressId(
    tx: Prisma.TransactionClient,
    item: { address: string; latitude: number; longitude: number },
  ) {
    const zoneId = await this.resolveZoneId(tx, item);

    const existingAddress = await tx.address.findFirst({
      where: {
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
      },
      select: { id: true, zoneId: true },
    });

    if (existingAddress) {
      if (zoneId && existingAddress.zoneId !== zoneId) {
        await tx.address.update({
          where: { id: existingAddress.id },
          data: { zoneId },
        });
      }

      return existingAddress.id;
    }

    const createdAddress = await tx.address.create({
      data: {
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        zoneId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    return createdAddress.id;
  }

  private async resolveZoneId(
    tx: Prisma.TransactionClient,
    item: { address: string; latitude: number; longitude: number },
  ) {
    const zoneKeyword =
      this.inferZoneKeywordByCoordinates(item.latitude, item.longitude) ??
      this.inferZoneKeyword(item.address);

    if (!zoneKeyword) return null;

    const zone = await tx.zone.findFirst({
      where: {
        OR: [
          { name: { contains: zoneKeyword, mode: "insensitive" } },
          { description: { contains: zoneKeyword, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    return zone?.id ?? null;
  }

  private inferZoneKeyword(address: string) {
    const normalized = address.toLowerCase();

    if (/(\bzona\s*norte\b|\bnorte\b)/i.test(normalized)) {
      return "norte";
    }

    if (/(\bzona\s*centro\b|\bcentro\b)/i.test(normalized)) {
      return "centro";
    }

    if (/(\bzona\s*sur\b|\bsur\b)/i.test(normalized)) {
      return "sur";
    }

    return null;
  }

  private inferZoneKeywordByCoordinates(latitude: number, longitude: number) {
    const withinTunjaRect =
      latitude >= this.tunjaBounds.minLat &&
      latitude <= this.tunjaBounds.maxLat &&
      longitude >= this.tunjaBounds.minLng &&
      longitude <= this.tunjaBounds.maxLng;

    // Si cae dentro del rectangulo de ciudad, dividimos en 3 franjas horizontales.
    if (withinTunjaRect) {
      if (latitude >= this.laRazaLat) {
        return "norte";
      }

      if (latitude >= this.bosqueRepublicaLat) {
        return "centro";
      }

      return "sur";
    }

    // Fallback para puntos cercanos fuera del rectangulo.
    if (latitude >= this.laRazaLat) {
      return "norte";
    }

    if (latitude >= this.bosqueRepublicaLat) {
      return "centro";
    }

    return "sur";
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
        documentNumber: dto.document.documentNumber,
      },
      select: { id: true },
    });
    if (duplicateDoc) {
      errors.push("Ya existe una persona con ese numero de documento");
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

  private async validateUpdateBusinessRules(
    studentId: number,
    dto: UpdateStudentDto,
  ) {
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
      if (dto.document.documentNumber) {
        errors.push(
          "No puedes modificar el numero de documento desde la edicion de estudiante",
        );
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

  private async resolveDocumentTypeId(documentTypeName: string) {
    const normalizedInput = documentTypeName.trim().toUpperCase();
    const aliasToCatalog: Record<string, string> = {
      CC: "Cedula de ciudadania",
      CEDULA: "Cedula de ciudadania",
      CEDULA_DE_CIUDADANIA: "Cedula de ciudadania",
      "CEDULA DE CIUDADANIA": "Cedula de ciudadania",
      TI: "Tarjeta de identidad",
      TARJETA_IDENTIDAD: "Tarjeta de identidad",
      "TARJETA DE IDENTIDAD": "Tarjeta de identidad",
      LICENCIA: "Licencia de conduccion",
      LICENCIA_CONDUCCION: "Licencia de conduccion",
      "LICENCIA DE CONDUCCION": "Licencia de conduccion",
      CE: "Cedula de extranjeria",
      CEDULA_EXTRANJERIA: "Cedula de extranjeria",
      "CEDULA DE EXTRANJERIA": "Cedula de extranjeria",
      PASAPORTE: "Pasaporte",
    };

    const targetName = aliasToCatalog[normalizedInput] ?? documentTypeName.trim();

    const documentType = await this.prisma.documentType.findFirst({
      where: {
        name: {
          equals: targetName,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (!documentType) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo registrar/actualizar el estudiante",
        errors: [
          `El tipo de documento '${documentTypeName}' no existe`,
        ],
      });
    }

    return documentType.id;
  }
}