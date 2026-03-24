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
            },
            personDocument: {
              findFirst: jest.fn(),
              create: jest.fn(),
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
          firstName: true,
          middleName: true,
          firstLastname: true,
          secondLastname: true,
          email: true,
          phone: true,
          status: true,
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
              documentType: validCreateGuardianDto.document.documentType,
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
      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);

      const result = await service.create(validCreateGuardianDto);

      expect(result).toEqual(guardianInDatabase);
      expect(prismaService.personDocument.findFirst).toHaveBeenCalledWith({
        where: {
          documentType: validCreateGuardianDto.document.documentType,
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

      await expect(service.create(validCreateGuardianDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(prismaService.personDocument.findFirst).toHaveBeenCalledWith({
        where: {
          documentType: validCreateGuardianDto.document.documentType,
          documentNumber: validCreateGuardianDto.document.documentNumber,
        },
        select: { id: true },
      });
    });

    it('should throw BadRequestException with correct message for duplicate document', async () => {
      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce({
        id: 1,
      } as any);

      try {
        await service.create(validCreateGuardianDto);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as any).getResponse()).toEqual(duplicateDocumentError);
      }
    });

    it('should include optional fields when provided', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          personDocument: {
            create: jest.fn().mockResolvedValueOnce({
              id: 1,
              documentType: validCreateGuardianDto.document.documentType,
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
      jest.spyOn(prismaService, '$transaction').mockImplementation(mockTransaction);

      const result = await service.create(validCreateGuardianDto);

      expect(result.middleName).toBe(validCreateGuardianDto.middleName);
      expect(result.secondLastname).toBe(validCreateGuardianDto.secondLastname);
      expect(result.phone).toBe(validCreateGuardianDto.phone);
    });
  });
});
