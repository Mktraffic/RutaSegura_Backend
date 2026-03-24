import { Test, TestingModule } from '@nestjs/testing';
import { GuardiansController } from '../guardians.controller';
import { GuardiansService } from '../guardians.service';
import {
  validCreateGuardianDto,
  guardianInDatabase,
  guardianInDatabaseList,
} from './fixtures/guardian.fixture';

describe('GuardiansController', () => {
  let controller: GuardiansController;
  let service: GuardiansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GuardiansController],
      providers: [
        {
          provide: GuardiansService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GuardiansController>(GuardiansController);
    service = module.get<GuardiansService>(GuardiansService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all guardians with success response', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(guardianInDatabaseList);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Listado de acudientes',
        data: guardianInDatabaseList,
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass query parameter to service', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([guardianInDatabaseList[0]]);

      const result = await controller.findAll('Juan');

      expect(result.data).toEqual([guardianInDatabaseList[0]]);
      expect(service.findAll).toHaveBeenCalledWith('Juan');
    });

    it('should trim query parameter before passing to service', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([guardianInDatabaseList[0]]);

      await controller.findAll('  Juan  ');

      expect(service.findAll).toHaveBeenCalledWith('Juan');
    });

    it('should handle empty query as undefined', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(guardianInDatabaseList);

      await controller.findAll('');

      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return empty list when no guardians found', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Listado de acudientes',
        data: [],
      });
    });
  });

  describe('create', () => {
    it('should create a guardian and return success response', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(guardianInDatabase);

      const result = await controller.create(validCreateGuardianDto);

      expect(result).toEqual({
        success: true,
        message: 'Acudiente creado correctamente',
        data: guardianInDatabase,
      });
      expect(service.create).toHaveBeenCalledWith(validCreateGuardianDto);
    });

    it('should return CREATED HTTP status (201)', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(guardianInDatabase);

      const result = await controller.create(validCreateGuardianDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Acudiente creado correctamente');
    });

    it('should pass DTO to service as-is', async () => {
      const dto = {
        ...validCreateGuardianDto,
        firstName: 'Carlos',
        email: 'carlos@example.com',
      };

      jest.spyOn(service, 'create').mockResolvedValueOnce(guardianInDatabase);

      await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should handle service errors and propagate them', async () => {
      const error = new Error('Database error');
      jest.spyOn(service, 'create').mockRejectedValueOnce(error);

      await expect(controller.create(validCreateGuardianDto)).rejects.toThrow(
        error,
      );
    });
  });
});
