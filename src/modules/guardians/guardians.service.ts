import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateGuardianDto, UpdateGuardianDto } from "./dto/create-guardian.dto";

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly guardianSelect = {
    id: true,
    documentId: true,
    firstName: true,
    middleName: true,
    firstLastname: true,
    secondLastname: true,
    phone: true,
    email: true,
    status: true,
    createdAt: true,
    document: {
      select: {
        id: true,
        documentType: {
          select: {
            id: true,
            name: true,
          },
        },
        documentNumber: true,
        description: true,
        status: true,
      },
    },
  } as const;

  async findAll(query?: string) {
    return this.prisma.guardian.findMany({
      where: query
        ? {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { middleName: { contains: query, mode: "insensitive" } },
              { firstLastname: { contains: query, mode: "insensitive" } },
              { secondLastname: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              {
                document: {
                  documentNumber: { contains: query, mode: "insensitive" },
                },
              },
              {
                document: {
                  documentType: {
                    name: { contains: query, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : undefined,
      orderBy: [{ firstName: "asc" }, { firstLastname: "asc" }],
      select: this.guardianSelect,
    });
  }

  async findOne(id: number) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      select: this.guardianSelect,
    });

    if (!guardian) {
      throw new NotFoundException({
        success: false,
        message: "Acudiente no encontrado",
      });
    }

    return guardian;
  }

  async update(id: number, dto: UpdateGuardianDto) {
    const guardian = await this.ensureGuardianExists(id);

    await this.validateUpdateBusinessRules(dto);

    return this.prisma.$transaction(async (tx) => {
      if (dto.document) {
        const documentTypeId = dto.document.documentType
          ? await this.resolveDocumentTypeId(dto.document.documentType)
          : undefined;

        await tx.personDocument.update({
          where: { id: guardian.documentId },
          data: {
            documentTypeId,
            description: dto.document.description,
          },
        });
      }

      await tx.guardian.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          middleName: dto.middleName,
          firstLastname: dto.firstLastname,
          secondLastname: dto.secondLastname,
          phone: dto.phone,
          email: dto.email,
          status: dto.status,
        },
      });

      const updated = await tx.guardian.findUnique({
        where: { id },
        select: this.guardianSelect,
      });

      return updated;
    });
  }

  async inactivate(id: number) {
    const guardian = await this.ensureGuardianExists(id);

    if (guardian.status?.toUpperCase() === "INACTIVE") {
      throw new BadRequestException({
        success: false,
        message: "No se pudo inactivar el acudiente",
        errors: ["El acudiente ya se encuentra inactivo"],
      });
    }

    return this.prisma.guardian.update({
      where: { id },
      data: { status: "INACTIVE" },
      select: this.guardianSelect,
    });
  }

  async create(dto: CreateGuardianDto) {
    const documentTypeId = await this.resolveDocumentTypeId(
      dto.document.documentType,
    );

    const existingDocument = await this.prisma.personDocument.findFirst({
      where: {
        documentNumber: dto.document.documentNumber,
      },
      select: { id: true },
    });

    if (existingDocument) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el acudiente",
        errors: ["Ya existe una persona con ese numero de documento"],
      });
    }

    const guardian = await this.prisma.$transaction(async (tx) => {
      const document = await tx.personDocument.create({
        data: {
          documentTypeId,
          documentNumber: dto.document.documentNumber,
          description: dto.document.description,
          status: "ACTIVE",
        },
      });

      return tx.guardian.create({
        data: {
          documentId: document.id,
          firstName: dto.firstName,
          middleName: dto.middleName,
          firstLastname: dto.firstLastname,
          secondLastname: dto.secondLastname,
          phone: dto.phone,
          email: dto.email,
          status: "ACTIVE",
        },
        select: {
          id: true,
          firstName: true,
          middleName: true,
          firstLastname: true,
          secondLastname: true,
          phone: true,
          email: true,
          status: true,
          document: {
            select: {
              id: true,
              documentType: {
                select: {
                  id: true,
                  name: true,
                },
              },
              documentNumber: true,
            },
          },
        },
      });
    });

    return guardian;
  }

  private async ensureGuardianExists(id: number) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      select: {
        id: true,
        documentId: true,
        status: true,
      },
    });

    if (!guardian) {
      throw new NotFoundException({
        success: false,
        message: "Acudiente no encontrado",
      });
    }

    return guardian;
  }

  private async validateUpdateBusinessRules(dto: UpdateGuardianDto) {
    const errors: string[] = [];

    if (dto.document) {
      const hasDocumentType = !!dto.document.documentType;
      const hasDocumentNumber = !!dto.document.documentNumber;

      if (hasDocumentNumber) {
        errors.push(
          "No puedes modificar el numero de documento desde la edicion de acudiente",
        );
      }

      if (hasDocumentType) {
        await this.resolveDocumentTypeId(dto.document.documentType!);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo actualizar el acudiente",
        errors,
      });
    }
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
        message: "No pudimos guardar el documento",
        errors: [
          `El tipo de documento '${documentTypeName}' no existe`,
        ],
      });
    }

    return documentType.id;
  }
}