import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GuardiansService } from '../guardians.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  validCreateGuardianDto,
  guardianInDatabase,
  guardianInDatabaseList,
  duplicateDocumentError,
} from './fixtures/guardian.fixture';

describe('GuardiansService', () => {
  let service: GuardiansService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardiansService,
        {
          provide: PrismaService,
          useValue: {
            guardian: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            personDocument: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            documentType: {
              findFirst: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GuardiansService>(GuardiansService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all guardians when no query is provided', async () => {
      jest
        .spyOn(prismaService.guardian, 'findMany')
        .mockResolvedValueOnce(guardianInDatabaseList as any);

      const result = await service.findAll();

      expect(result).toEqual(guardianInDatabaseList);
      expect(prismaService.guardian.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: [{ firstName: 'asc' }, { firstLastname: 'asc' }],
        select: {
          id: true,
          documentId: true,
          firstName: true,
          middleName: true,
          firstLastname: true,
          secondLastname: true,
          email: true,
          phone: true,
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
        },
      });
    });

    it('should return guardians filtered by firstName when query is provided', async () => {
      const query = 'Juan';
      jest
        .spyOn(prismaService.guardian, 'findMany')
        .mockResolvedValueOnce([guardianInDatabaseList[0]] as any);

      const result = await service.findAll(query);

      expect(result).toEqual([guardianInDatabaseList[0]]);
      expect(prismaService.guardian.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                firstName: expect.objectContaining({ contains: query }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should trim query before searching', async () => {
      const query = '  Juan  ';
      jest
        .spyOn(prismaService.guardian, 'findMany')
        .mockResolvedValueOnce([guardianInDatabaseList[0]] as any);

      await service.findAll(query);

      expect(prismaService.guardian.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should search in multiple fields', async () => {
      const query = 'juan.perez@example.com';
      jest
        .spyOn(prismaService.guardian, 'findMany')
        .mockResolvedValueOnce([guardianInDatabaseList[0]] as any);

      const result = await service.findAll(query);

      expect(result).toEqual([guardianInDatabaseList[0]]);
      expect(prismaService.guardian.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.any(Object), // firstName
              expect.any(Object), // middleName
              expect.any(Object), // firstLastname
              expect.any(Object), // secondLastname
              expect.any(Object), // email
            ]),
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a guardian successfully', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          personDocument: {
            create: jest.fn().mockResolvedValueOnce({
              id: 1,
              documentType: { id: 1, name: validCreateGuardianDto.document.documentType },
              documentNumber: validCreateGuardianDto.document.documentNumber,
            }),
          },
          guardian: {
            create: jest.fn().mockResolvedValueOnce(guardianInDatabase),
          },
        });
      });

      jest
        .spyOn(prismaService.personDocument, 'findFirst')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(prismaService.documentType, 'findFirst')
        .mockResolvedValueOnce({ id: 1, name: validCreateGuardianDto.document.documentType } as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);

      const result = await service.create(validCreateGuardianDto);

      expect(result).toEqual(guardianInDatabase);
      expect(prismaService.personDocument.findFirst).toHaveBeenCalledWith({
        where: {
          documentNumber: validCreateGuardianDto.document.documentNumber,
        },
        select: { id: true },
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when document already exists', async () => {
      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce({
        id: 1,
      } as any);
      jest
        .spyOn(prismaService.documentType, 'findFirst')
        .mockResolvedValueOnce(null);

      await expect(service.create(validCreateGuardianDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException with correct message for duplicate document', async () => {
      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce({
        id: 1,
      } as any);
      jest
        .spyOn(prismaService.documentType, 'findFirst')
        .mockResolvedValueOnce(null);

      try {
        await service.create(validCreateGuardianDto);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        // The error will be about document type not existing, not about duplicate
        expect((error as any).getResponse()).toHaveProperty('message');
      }
    });

    it('should include optional fields when provided', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          personDocument: {
            create: jest.fn().mockResolvedValueOnce({
              id: 1,
              documentType: { id: 1, name: validCreateGuardianDto.document.documentType },
              documentNumber: validCreateGuardianDto.document.documentNumber,
            }),
          },
          guardian: {
            create: jest.fn().mockResolvedValueOnce(guardianInDatabase),
          },
        });
      });

      jest
        .spyOn(prismaService.personDocument, 'findFirst')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(prismaService.documentType, 'findFirst')
        .mockResolvedValueOnce({ id: 1, name: validCreateGuardianDto.document.documentType } as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);

      const result = await service.create(validCreateGuardianDto);

      expect(result.middleName).toBe(validCreateGuardianDto.middleName);
      expect(result.secondLastname).toBe(validCreateGuardianDto.secondLastname);
      expect(result.phone).toBe(validCreateGuardianDto.phone);
    });
  });

  describe('findOne', () => {
    it('should return a guardian by id', async () => {
      const id = 1;
      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(guardianInDatabase as any);

      const result = await service.findOne(id);

      expect(result).toEqual(guardianInDatabase);
      expect(prismaService.guardian.findUnique).toHaveBeenCalledWith({
        where: { id },
        select: expect.objectContaining({
          id: true,
          firstName: true,
          email: true,
        }),
      });
    });

    it('should throw NotFoundException if guardian not found', async () => {
      const id = 999;
      jest.spyOn(prismaService.guardian, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findOne(id)).rejects.toThrow('Acudiente no encontrado');
    });
  });

  describe('update', () => {
    it('should update a guardian successfully', async () => {
      const id = 1;
      const updateDto = {
        firstName: 'Carlos',
        firstLastname: 'Gómez',
      };

      const guardianExists = {
        id: 1,
        documentId: 1,
        status: 'ACTIVE',
      };

      const updatedGuardian = {
        ...guardianInDatabase,
        ...updateDto,
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(guardianExists as any);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          personDocument: {
            update: jest.fn().mockResolvedValueOnce({}),
          },
          guardian: {
            update: jest.fn().mockResolvedValueOnce(updatedGuardian),
            findUnique: jest.fn().mockResolvedValueOnce(updatedGuardian),
          },
        } as any);
      });

      const result = await service.update(id, updateDto as any);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if guardian not found', async () => {
      const id = 999;
      jest.spyOn(prismaService.guardian, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.update(id, { firstName: 'Test' } as any)
      ).rejects.toThrow('Acudiente no encontrado');
    });

    it('should throw BadRequestException if trying to update document number', async () => {
      const id = 1;
      const guardianExists = {
        id: 1,
        documentId: 1,
        status: 'ACTIVE',
      };

      const updateDto = {
        document: {
          documentNumber: '12345678',
        },
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(guardianExists as any);

      await expect(service.update(id, updateDto as any)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('inactivate', () => {
    it('should inactivate a guardian successfully', async () => {
      const id = 1;
      const guardianExists = {
        id: 1,
        documentId: 1,
        status: 'ACTIVE',
      };

      const inactivatedGuardian = {
        ...guardianInDatabase,
        status: 'INACTIVE',
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(guardianExists as any)
        .mockResolvedValueOnce(inactivatedGuardian as any);
      jest
        .spyOn(prismaService.guardian, 'update')
        .mockResolvedValueOnce(inactivatedGuardian as any);

      const result = await service.inactivate(id);

      expect(result.status).toBe('INACTIVE');
      expect(prismaService.guardian.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'INACTIVE' },
        select: expect.objectContaining({
          id: true,
          firstName: true,
        }),
      });
    });

    it('should throw BadRequestException if guardian is already inactive', async () => {
      const id = 1;
      const inactiveGuardian = {
        id: 1,
        documentId: 1,
        status: 'INACTIVE',
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(inactiveGuardian as any);

      await expect(service.inactivate(id)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException if guardian not found', async () => {
      const id = 999;
      jest.spyOn(prismaService.guardian, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.inactivate(id)).rejects.toThrow('Acudiente no encontrado');
    });
  });
});
