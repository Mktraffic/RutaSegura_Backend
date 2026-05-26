import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DriversService } from '../drivers.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  validCreateDriverDto,
  validCreateDriverDtoWithoutOptionals,
  driverInDatabase,
  driverInDatabaseList,
  duplicateEmailError,
  driverNotFoundError,
  driverAlreadyInactiveError,
} from './fixtures/driver.fixture';

describe('DriversService', () => {
  let service: DriversService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: PrismaService,
          useValue: {
            person: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            personDocument: {
              findFirst: jest.fn(),
              create: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              update: jest.fn(),
            },
            personDocumentLink: {
              create: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
            documentType: {
              findFirst: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a driver successfully', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce(driverInDatabase);
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce({
        id: 1,
        name: 'CC',
      } as any);

      const result = await service.create(validCreateDriverDto);

      expect(result).toEqual(driverInDatabase);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should create a driver without optional fields', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce({
        ...driverInDatabase,
        middleName: null,
        secondLastname: null,
      });
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce({
        id: 1,
        name: 'CC',
      } as any);

      const result = await service.create(validCreateDriverDtoWithoutOptionals);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when email already exists', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce({
        id: 99,
      } as any);

      await expect(service.create(validCreateDriverDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when document type does not exist', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce(null);

      await expect(service.create(validCreateDriverDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all drivers when no query is provided', async () => {
      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce(driverInDatabaseList);

      const result = await service.findAll();

      expect(result).toEqual(driverInDatabaseList);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            personType: 'DRIVER',
          },
          orderBy: [
            { firstName: 'asc' },
            { firstLastname: 'asc' },
          ],
        }),
      );
    });

    it('should return filtered drivers with query', async () => {
      const query = 'Juan';
      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce([driverInDatabaseList[0]]);

      const result = await service.findAll(query);

      expect(result).toEqual([driverInDatabaseList[0]]);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            personType: 'DRIVER',
            OR: expect.any(Array),
          }),
          orderBy: [
            { firstName: 'asc' },
            { firstLastname: 'asc' },
          ],
        }),
      );
    });

    it('should return empty array when no drivers match query', async () => {
      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findAll('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return driver by id', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(driverInDatabase as any);

      const result = await service.findOne(1);

      expect(result).toEqual(driverInDatabase);
      expect(prismaService.person.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          personType: 'DRIVER',
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when driver does not exist', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update driver successfully', async () => {
      const updateDto = {
        firstName: 'Carlos',
        firstLastname: 'García',
        email: 'carlos@example.com',
      };

      const mockTransaction = jest.fn().mockResolvedValueOnce({
        ...driverInDatabase,
        firstName: 'Carlos',
        firstLastname: 'García',
        email: 'carlos@example.com',
      });

      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(driverInDatabase as any);
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);

      const result = await service.update(1, updateDto);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should update driver with document information', async () => {
      const updateDto = {
        firstName: 'Carlos',
        document: {
          documentType: 'CC',
        },
      };

      const mockTransaction = jest.fn().mockResolvedValueOnce({
        ...driverInDatabase,
        firstName: 'Carlos',
      });

      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(driverInDatabase as any);
      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce({
        id: 1,
        name: 'CC',
      } as any);
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);

      const result = await service.update(1, updateDto);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when driver does not exist', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);

      await expect(
        service.update(999, { firstName: 'Carlos' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('inactivate', () => {
    it('should inactivate active driver', async () => {
      const activeDriver = { ...driverInDatabase, status: 'ACTIVE' };
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(activeDriver as any);
      jest.spyOn(prismaService.person, 'update').mockResolvedValueOnce({
        ...driverInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await service.inactivate(1);

      expect(result.status).toBe('INACTIVE');
      expect(prismaService.person.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'INACTIVE' },
        select: expect.any(Object),
      });
    });

    it('should throw BadRequestException when driver is already inactive', async () => {
      const inactiveDriver = { ...driverInDatabase, status: 'INACTIVE' };
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(inactiveDriver as any);

      await expect(service.inactivate(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when driver does not exist', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);

      await expect(service.inactivate(999)).rejects.toThrow(NotFoundException);
    });
  });
});
