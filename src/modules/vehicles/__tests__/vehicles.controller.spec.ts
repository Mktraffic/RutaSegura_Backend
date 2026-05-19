import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from '../vehicles.controller';
import { VehiclesService } from '../vehicles.service';
import {
  validCreateVehicleDto,
  updateVehicleDto,
  vehicleInDatabase,
  vehicleInDatabaseList,
} from './fixtures/vehicle.fixture';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            inactivate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle and return success response', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(vehicleInDatabase as any);

      const result = await controller.create(validCreateVehicleDto);

      expect(result).toEqual({
        success: true,
        message: 'Vehiculo registrado correctamente',
        data: vehicleInDatabase,
      });
      expect(service.create).toHaveBeenCalledWith(validCreateVehicleDto);
    });
  });

  describe('findAll', () => {
    it('should return all vehicles with success response', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(vehicleInDatabaseList as any);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Listado de vehiculos',
        data: vehicleInDatabaseList,
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered vehicles with query', async () => {
      const query = 'Toyota';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([vehicleInDatabase] as any);

      const result = await controller.findAll(query);

      expect(result).toEqual({
        success: true,
        message: 'Listado de vehiculos',
        data: [vehicleInDatabase],
      });
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should trim query parameter', async () => {
      const query = '  Toyota  ';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([vehicleInDatabase] as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith('Toyota');
    });

    it('should return undefined when query is empty after trim', async () => {
      const query = '   ';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(vehicleInDatabaseList as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findOne', () => {
    it('should return a single vehicle with success response', async () => {
      const plate = 'ABC-123';
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(vehicleInDatabase as any);

      const result = await controller.findOne(plate);

      expect(result).toEqual({
        success: true,
        message: 'Detalle del vehiculo',
        data: vehicleInDatabase,
      });
      expect(service.findOne).toHaveBeenCalledWith(plate);
    });
  });

  describe('update', () => {
    it('should update a vehicle and return success response', async () => {
      const plate = 'ABC-123';
      jest.spyOn(service, 'update').mockResolvedValueOnce({
        ...vehicleInDatabase,
        passengerCapacity: updateVehicleDto.passengerCapacity,
      } as any);

      const result = await controller.update(plate, updateVehicleDto);

      expect(result).toEqual({
        success: true,
        message: 'Vehiculo actualizado correctamente',
        data: {
          ...vehicleInDatabase,
          passengerCapacity: updateVehicleDto.passengerCapacity,
        },
      });
      expect(service.update).toHaveBeenCalledWith(plate, updateVehicleDto);
    });
  });

  describe('inactivate', () => {
    it('should inactivate a vehicle and return success response', async () => {
      const plate = 'ABC-123';
      const user = { email: 'admin@example.com' };
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce({
        ...vehicleInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await controller.inactivate(plate, user as any);

      expect(result).toEqual({
        success: true,
        message: 'Vehiculo inactivado correctamente',
        data: {
          ...vehicleInDatabase,
          status: 'INACTIVE',
        },
      });
      expect(service.inactivate).toHaveBeenCalledWith(plate, user.email);
    });

    it('should inactivate a vehicle without user', async () => {
      const plate = 'ABC-123';
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce({
        ...vehicleInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await controller.inactivate(plate);

      expect(result).toEqual({
        success: true,
        message: 'Vehiculo inactivado correctamente',
        data: {
          ...vehicleInDatabase,
          status: 'INACTIVE',
        },
      });
      expect(service.inactivate).toHaveBeenCalledWith(plate, undefined);
    });
  });
});
