import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VehiclesService } from '../vehicles.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  validCreateVehicleDto,
  validCreateVehicleDtoWithoutOptionals,
  updateVehicleDto,
  vehicleInDatabase,
  vehicleInDatabaseList,
  duplicatePlateError,
  vehicleNotFoundError,
} from './fixtures/vehicle.fixture';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: {
            vehicle: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            vehicleDocument: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle successfully', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce(vehicleInDatabase);
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      const result = await service.create(validCreateVehicleDto);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should create a vehicle without optional fields', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce({
        ...vehicleInDatabase,
        brand: null,
        model: null,
        year: null,
      });
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      const result = await service.create(validCreateVehicleDtoWithoutOptionals);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when plate already exists', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce({
        plate: 'ABC-123',
      } as any);

      await expect(service.create(validCreateVehicleDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all vehicles without query', async () => {
      jest
        .spyOn(prismaService.vehicle, 'findMany')
        .mockResolvedValueOnce(vehicleInDatabaseList as any);

      const result = await service.findAll();

      expect(result).toEqual(vehicleInDatabaseList);
      expect(prismaService.vehicle.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { plate: 'asc' },
        select: expect.any(Object),
      });
    });

    it('should return filtered vehicles with query', async () => {
      jest
        .spyOn(prismaService.vehicle, 'findMany')
        .mockResolvedValueOnce([vehicleInDatabase as any]);

      const result = await service.findAll('Toyota');

      expect(result).toBeDefined();
      expect(prismaService.vehicle.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { plate: { contains: 'Toyota', mode: 'insensitive' } },
            { brand: { contains: 'Toyota', mode: 'insensitive' } },
            { model: { contains: 'Toyota', mode: 'insensitive' } },
          ],
        },
        orderBy: { plate: 'asc' },
        select: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a single vehicle', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(vehicleInDatabase as any);

      const result = await service.findOne('ABC-123');

      expect(result).toEqual(vehicleInDatabase);
      expect(prismaService.vehicle.findUnique).toHaveBeenCalledWith({
        where: { plate: 'ABC-123' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if vehicle does not exist', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findOne('XYZ-999')).rejects.toThrow(NotFoundException);
    });

    it('should normalize plate to uppercase', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(vehicleInDatabase as any);

      await service.findOne('abc-123');

      expect(prismaService.vehicle.findUnique).toHaveBeenCalledWith({
        where: { plate: 'ABC-123' },
        select: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update a vehicle successfully', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce({
        ...vehicleInDatabase,
        passengerCapacity: updateVehicleDto.passengerCapacity,
      });
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(vehicleInDatabase as any);

      const result = await service.update('ABC-123', updateVehicleDto);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if vehicle does not exist', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.update('XYZ-999', updateVehicleDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should normalize plate to uppercase', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(vehicleInDatabase as any);
      jest.spyOn(prismaService, '$transaction' as any).mockResolvedValueOnce({
        ...vehicleInDatabase,
        passengerCapacity: updateVehicleDto.passengerCapacity,
      });

      await service.update('abc-123', updateVehicleDto);

      expect(prismaService.vehicle.findUnique).toHaveBeenCalledWith({
        where: { plate: 'ABC-123' },
        select: expect.any(Object),
      });
    });
  });

  describe('inactivate', () => {
    it('should inactivate a vehicle successfully', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce({
        ...vehicleInDatabase,
        status: 'INACTIVE',
      });
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(vehicleInDatabase as any);

      const result = await service.inactivate('ABC-123', 'admin@example.com');

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if vehicle does not exist', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.inactivate('XYZ-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if vehicle is already inactive', async () => {
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce({
        ...vehicleInDatabase,
        status: 'INACTIVE',
      } as any);

      await expect(service.inactivate('ABC-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
