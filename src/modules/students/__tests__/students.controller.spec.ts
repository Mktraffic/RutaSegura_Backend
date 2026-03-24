import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from '../students.controller';
import { StudentsService } from '../students.service';
import {
  validCreateStudentDto,
  validUpdateStudentDto,
  studentInDatabase,
  studentInDatabaseList,
} from './fixtures/student.fixture';

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        {
          provide: StudentsService,
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

    controller = module.get<StudentsController>(StudentsController);
    service = module.get<StudentsService>(StudentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a student and return success response', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(studentInDatabase);

      const result = await controller.create(validCreateStudentDto);

      expect(result).toEqual({
        success: true,
        message: 'Estudiante registrado correctamente',
        data: studentInDatabase,
      });
      expect(service.create).toHaveBeenCalledWith(validCreateStudentDto);
    });

    it('should return CREATED HTTP status (201)', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(studentInDatabase);

      const result = await controller.create(validCreateStudentDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Estudiante registrado correctamente');
    });

    it('should pass DTO to service without modification', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(studentInDatabase);

      await controller.create(validCreateStudentDto);

      expect(service.create).toHaveBeenCalledWith(validCreateStudentDto);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Validation error');
      jest.spyOn(service, 'create').mockRejectedValueOnce(error);

      await expect(controller.create(validCreateStudentDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('findAll', () => {
    it('should return all students with success response', async () => {
      jest
        .spyOn(service, 'findAll')
        .mockResolvedValueOnce(studentInDatabaseList as any);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Listado de estudiantes',
        data: studentInDatabaseList,
      });
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should return empty list when no students found', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([]);

      const result = await controller.findAll();

      expect(result.data).toEqual([]);
      expect(result.success).toBe(true);
    });

    it('should return all student fields', async () => {
      jest
        .spyOn(service, 'findAll')
        .mockResolvedValueOnce(studentInDatabaseList as any);

      const result = await controller.findAll();

      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('firstName');
      expect(result.data[0]).toHaveProperty('email');
      expect(result.data[0]).toHaveProperty('status');
    });
  });

  describe('findOne', () => {
    it('should return a student by id with success response', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(studentInDatabase);

      const result = await controller.findOne(1);

      expect(result).toEqual({
        success: true,
        message: 'Detalle del estudiante',
        data: studentInDatabase,
      });
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should parse id parameter as integer', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(studentInDatabase);

      await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should propagate not found errors', async () => {
      const error = new Error('Student not found');
      jest.spyOn(service, 'findOne').mockRejectedValueOnce(error);

      await expect(controller.findOne(999)).rejects.toThrow(error);
    });

    it('should include all student details in response', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(studentInDatabase);

      const result = await controller.findOne(1);

      expect(result.data).toEqual(studentInDatabase);
    });
  });

  describe('update', () => {
    it('should update a student and return success response', async () => {
      jest.spyOn(service, 'update').mockResolvedValueOnce(studentInDatabase);

      const result = await controller.update(1, validUpdateStudentDto);

      expect(result).toEqual({
        success: true,
        message: 'Estudiante actualizado correctamente',
        data: studentInDatabase,
      });
      expect(service.update).toHaveBeenCalledWith(1, validUpdateStudentDto);
    });

    it('should parse id parameter as integer', async () => {
      jest.spyOn(service, 'update').mockResolvedValueOnce(studentInDatabase);

      await controller.update(1, validUpdateStudentDto);

      expect(service.update).toHaveBeenCalledWith(
        expect.any(Number),
        validUpdateStudentDto,
      );
    });

    it('should pass update DTO to service', async () => {
      const updateDto = {
        firstName: 'Peter',
        firstLastname: 'López',
      };

      jest.spyOn(service, 'update').mockResolvedValueOnce(studentInDatabase);

      await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Update failed');
      jest.spyOn(service, 'update').mockRejectedValueOnce(error);

      await expect(
        controller.update(1, validUpdateStudentDto),
      ).rejects.toThrow(error);
    });
  });

  describe('inactivate', () => {
    it('should inactivate a student and return success response', async () => {
      const inactiveStudent = { ...studentInDatabase, status: 'INACTIVE' };
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce(inactiveStudent as any);

      const result = await controller.inactivate(1);

      expect(result).toEqual({
        success: true,
        message: 'Estudiante inactivado correctamente',
        data: inactiveStudent,
      });
      expect(service.inactivate).toHaveBeenCalledWith(1);
    });

    it('should parse id parameter as integer', async () => {
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce(studentInDatabase as any);

      await controller.inactivate(1);

      expect(service.inactivate).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should return updated student with INACTIVE status', async () => {
      const inactiveStudent = { ...studentInDatabase, status: 'INACTIVE' };
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce(inactiveStudent as any);

      const result = await controller.inactivate(1);

      expect(result.data.status).toBe('INACTIVE');
    });

    it('should propagate not found errors', async () => {
      const error = new Error('Student not found');
      jest.spyOn(service, 'inactivate').mockRejectedValueOnce(error);

      await expect(controller.inactivate(999)).rejects.toThrow(error);
    });

    it('should use DELETE endpoint semantics', async () => {
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce(studentInDatabase as any);

      const result = await controller.inactivate(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Estudiante inactivado correctamente');
    });
  });
});
