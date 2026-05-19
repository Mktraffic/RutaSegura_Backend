import { Test, TestingModule } from '@nestjs/testing';
import { RoutesController } from '../routes.controller';
import { RoutesService } from '../routes.service';
import {
  validCreateRouteDto,
  updateRouteDto,
  routeInDatabase,
  routeInDatabaseList,
  validCreateRouteAssignmentDto,
  updateRouteAssignmentDto,
  routeAssignmentInDatabase,
  routeAssignmentList,
} from './fixtures/route.fixture';

describe('RoutesController', () => {
  let controller: RoutesController;
  let service: RoutesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoutesController],
      providers: [
        {
          provide: RoutesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            inactivate: jest.fn(),
            listAssignments: jest.fn(),
            createAssignment: jest.fn(),
            updateAssignment: jest.fn(),
            inactivateAssignment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RoutesController>(RoutesController);
    service = module.get<RoutesService>(RoutesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a route and return success response', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(routeInDatabase as any);

      const result = await controller.create(validCreateRouteDto);

      expect(result).toEqual({
        success: true,
        message: 'Ruta registrada correctamente',
        data: routeInDatabase,
      });
      expect(service.create).toHaveBeenCalledWith(validCreateRouteDto);
    });
  });

  describe('findAll', () => {
    it('should return all routes with success response', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([routeInDatabase] as any);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Listado de rutas',
        data: [routeInDatabase],
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined, undefined);
    });

    it('should return filtered routes with query', async () => {
      const query = 'Centro';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([routeInDatabase] as any);

      const result = await controller.findAll(query);

      expect(result).toEqual({
        success: true,
        message: 'Listado de rutas',
        data: [routeInDatabase],
      });
      expect(service.findAll).toHaveBeenCalledWith(query, undefined, undefined);
    });

    it('should return filtered routes with status', async () => {
      const status = 'ACTIVE';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([routeInDatabase] as any);

      const result = await controller.findAll(undefined, status);

      expect(result).toEqual({
        success: true,
        message: 'Listado de rutas',
        data: [routeInDatabase],
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined, status, undefined);
    });

    it('should return filtered routes with zoneId', async () => {
      const zoneId = '1';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([routeInDatabase] as any);

      const result = await controller.findAll(undefined, undefined, zoneId);

      expect(result).toEqual({
        success: true,
        message: 'Listado de rutas',
        data: [routeInDatabase],
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined, 1);
    });

    it('should trim query parameter', async () => {
      const query = '  Centro  ';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([routeInDatabase] as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith('Centro', undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should return a single route with success response', async () => {
      const id = '1';
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(routeInDatabase as any);

      const result = await controller.findOne(id);

      expect(result).toEqual({
        success: true,
        message: 'Detalle de la ruta',
        data: routeInDatabase,
      });
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a route and return success response', async () => {
      const id = '1';
      jest.spyOn(service, 'update').mockResolvedValueOnce({
        ...routeInDatabase,
        name: updateRouteDto.name,
      } as any);

      const result = await controller.update(id, updateRouteDto);

      expect(result).toEqual({
        success: true,
        message: 'Ruta actualizada correctamente',
        data: {
          ...routeInDatabase,
          name: updateRouteDto.name,
        },
      });
      expect(service.update).toHaveBeenCalledWith(1, updateRouteDto);
    });
  });

  describe('inactivate', () => {
    it('should inactivate a route and return success response', async () => {
      const id = '1';
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce({
        ...routeInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await controller.inactivate(id);

      expect(result).toEqual({
        success: true,
        message: 'Ruta inactivada correctamente',
        data: {
          ...routeInDatabase,
          status: 'INACTIVE',
        },
      });
      expect(service.inactivate).toHaveBeenCalledWith(1);
    });
  });

  describe('listAssignments', () => {
    it('should return all assignments for a route', async () => {
      const id = '1';
      jest.spyOn(service, 'listAssignments').mockResolvedValueOnce([routeAssignmentInDatabase] as any);

      const result = await controller.listAssignments(id);

      expect(result).toEqual({
        success: true,
        message: 'Listado de asignaciones',
        data: [routeAssignmentInDatabase],
      });
      expect(service.listAssignments).toHaveBeenCalledWith(1);
    });
  });

  describe('createAssignment', () => {
    it('should create a route assignment and return success response', async () => {
      const id = '1';
      jest.spyOn(service, 'createAssignment').mockResolvedValueOnce(routeAssignmentInDatabase as any);

      const result = await controller.createAssignment(id, validCreateRouteAssignmentDto);

      expect(result).toEqual({
        success: true,
        message: 'Asignacion creada correctamente',
        data: routeAssignmentInDatabase,
      });
      expect(service.createAssignment).toHaveBeenCalledWith(1, validCreateRouteAssignmentDto);
    });
  });

  describe('updateAssignment', () => {
    it('should update a route assignment and return success response', async () => {
      const id = '1';
      const assignmentId = '1';
      jest.spyOn(service, 'updateAssignment').mockResolvedValueOnce({
        ...routeAssignmentInDatabase,
        stopId: 2,
      } as any);

      const result = await controller.updateAssignment(id, assignmentId, updateRouteAssignmentDto);

      expect(result).toEqual({
        success: true,
        message: 'Asignacion actualizada correctamente',
        data: {
          ...routeAssignmentInDatabase,
          stopId: 2,
        },
      });
      expect(service.updateAssignment).toHaveBeenCalledWith(1, 1, updateRouteAssignmentDto);
    });
  });

  describe('inactivateAssignment', () => {
    it('should inactivate a route assignment and return success response', async () => {
      const id = '1';
      const assignmentId = '1';
      jest.spyOn(service, 'inactivateAssignment').mockResolvedValueOnce({
        ...routeAssignmentInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await controller.inactivateAssignment(id, assignmentId);

      expect(result).toEqual({
        success: true,
        message: 'Asignacion inactivada correctamente',
        data: {
          ...routeAssignmentInDatabase,
          status: 'INACTIVE',
        },
      });
      expect(service.inactivateAssignment).toHaveBeenCalledWith(1, 1);
    });
  });
});
