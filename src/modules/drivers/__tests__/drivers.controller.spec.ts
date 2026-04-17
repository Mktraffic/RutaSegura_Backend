import { Test, TestingModule } from '@nestjs/testing';
import { DriversController } from '../drivers.controller';
import { DriversService } from '../drivers.service';
import {
  validCreateDriverDto,
  driverInDatabase,
  driverInDatabaseList,
} from './fixtures/driver.fixture';

describe('DriversController', () => {
  let controller: DriversController;
  let service: DriversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriversController],
      providers: [
        {
          provide: DriversService,
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

    controller = module.get<DriversController>(DriversController);
    service = module.get<DriversService>(DriversService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a driver and return success response', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(driverInDatabase as any);

      const result = await controller.create(validCreateDriverDto);

      expect(result).toEqual({
        success: true,
        message: 'Conductor registrado correctamente',
        data: driverInDatabase,
      });
      expect(service.create).toHaveBeenCalledWith(validCreateDriverDto);
    });
  });

  describe('findAll', () => {
    it('should return all drivers with success response', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(driverInDatabaseList);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Listado de conductores',
        data: driverInDatabaseList,
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered drivers with query', async () => {
      const query = 'juan';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([driverInDatabaseList[0]]);

      const result = await controller.findAll(query);

      expect(result).toEqual({
        success: true,
        message: 'Listado de conductores',
        data: [driverInDatabaseList[0]],
      });
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should trim query parameter', async () => {
      const query = '  juan  ';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([driverInDatabaseList[0]]);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith('juan');
    });

    it('should return undefined when query is empty after trim', async () => {
      const query = '   ';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(driverInDatabaseList);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findOne', () => {
    it('should return driver by id with success response', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(driverInDatabase as any);

      const result = await controller.findOne(1);

      expect(result).toEqual({
        success: true,
        message: 'Detalle del conductor',
        data: driverInDatabase,
      });
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update driver and return success response', async () => {
      const updateDto = {
        firstName: 'Carlos',
      };
      const updatedDriver = {
        ...driverInDatabase,
        firstName: 'Carlos',
      };
      jest.spyOn(service, 'update').mockResolvedValueOnce(updatedDriver as any);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual({
        success: true,
        message: 'Conductor actualizado correctamente',
        data: updatedDriver,
      });
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('inactivate', () => {
    it('should inactivate driver and return success response', async () => {
      const inactiveDriver = { ...driverInDatabase, status: 'INACTIVE' };
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce(inactiveDriver as any);

      const result = await controller.inactivate(1);

      expect(result).toEqual({
        success: true,
        message: 'Conductor inactivado correctamente',
        data: inactiveDriver,
      });
      expect(service.inactivate).toHaveBeenCalledWith(1);
    });
  });
});
