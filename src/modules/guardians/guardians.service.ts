import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateGuardianDto } from "./dto/create-guardian.dto";

@Injectable()
export class GuardiansService {
  constructor(private readonly prisma: PrismaService) {}

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
            ],
          }
        : undefined,
      orderBy: [{ firstName: "asc" }, { firstLastname: "asc" }],
      select: {
        id: true,
        firstName: true,
        middleName: true,
        firstLastname: true,
        secondLastname: true,
        email: true,
        phone: true,
        status: true,
      },
    });
  }

  async create(dto: CreateGuardianDto) {
    const existingDocument = await this.prisma.personDocument.findFirst({
      where: {
        documentType: dto.document.documentType,
        documentNumber: dto.document.documentNumber,
      },
      select: { id: true },
    });

    if (existingDocument) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo crear el acudiente",
        errors: ["Ya existe un documento con ese tipo y numero"],
      });
    }

    const guardian = await this.prisma.$transaction(async (tx) => {
      const document = await tx.personDocument.create({
        data: {
          documentType: dto.document.documentType,
          documentNumber: dto.document.documentNumber,
          description: dto.document.description,
          status: "active",
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
          status: "active",
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
              documentType: true,
              documentNumber: true,
            },
          },
        },
      });
    });

    return guardian;
  }
}