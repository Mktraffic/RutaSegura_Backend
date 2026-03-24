import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { StudentsService } from '../students.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  validCreateStudentDto,
  validUpdateStudentDto,
  studentInDatabase,
  studentInDatabaseList,
} from './fixtures/student.fixture';

describe('StudentsService', () => {
  let service: StudentsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: PrismaService,
          useValue: {
            person: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            personDocument: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            personDocumentLink: {
              findFirst: jest.fn(),
              create: jest.fn(),
              deleteMany: jest.fn(),
            },
            personAddress: {
              findMany: jest.fn(),
              upsert: jest.fn(),
              deleteMany: jest.fn(),
            },
            address: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            guardian: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should validate guardian exists when creating', async () => {
      jest.spyOn(prismaService.guardian, 'findUnique').mockResolvedValueOnce({
        id: 1,
        firstName: 'Juan',
      } as any);

      // The service will validate inputs
      expect(prismaService.guardian.findUnique).not.toHaveBeenCalled();
      
      // This test verifies that findUnique is called as part of validation
      try {
        await service.create(validCreateStudentDto);
      } catch {
        // Expected to fail due to validation setup
      }

      expect(prismaService.guardian.findUnique).toHaveBeenCalled();
    });

    it('should throw BadRequestException when guardian does not exist', async () => {
      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(service.create(validCreateStudentDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when document already exists', async () => {
      jest.spyOn(prismaService.guardian, 'findUnique').mockResolvedValueOnce({
        id: 1,
        firstName: 'Juan',
      } as any);

      jest
        .spyOn(prismaService.personDocument, 'findFirst')
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.create(validCreateStudentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all students', async () => {
      jest
        .spyOn(prismaService.person, 'findMany')
        .mockResolvedValueOnce(studentInDatabaseList);

      const result = await service.findAll();

      expect(result).toEqual(studentInDatabaseList);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { personType: 'STUDENT' },
          orderBy: { id: 'desc' },
        }),
      );
    });

    it('should return empty array when no students found', async () => {
      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);

      const result = await service.findOne(1);

      expect(result).toEqual(studentInDatabase);
      expect(prismaService.person.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, personType: 'STUDENT' },
        }),
      );
    });

    it('should throw NotFoundException when student does not exist', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with correct message', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);

      try {
        await service.findOne(999);
        fail('Should have thrown NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as any).getResponse().message).toBe('Estudiante no encontrado');
      }
    });
  });

  describe('update', () => {
    it('should validate student exists before updating', async () => {
      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      // Service should attempt to call transaction for update
      jest
        .spyOn(prismaService, '$transaction')
        .mockRejectedValueOnce(new Error('Transaction error'));

      await expect(
        service.update(1, validUpdateStudentDto),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when student does not exist', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);

      await expect(
        service.update(999, validUpdateStudentDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when guardian does not exist on update', async () => {
      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(
        service.update(1, validUpdateStudentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('inactivate', () => {
    it('should inactivate a student', async () => {
      const inactiveStudent = { ...studentInDatabase, status: 'INACTIVE' };

      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);

      jest
        .spyOn(prismaService.person, 'update')
        .mockResolvedValueOnce(inactiveStudent);

      const result = await service.inactivate(1);

      expect(result.status).toBe('INACTIVE');
      expect(prismaService.person.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'INACTIVE' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when student does not exist', async () => {
      jest.spyOn(prismaService.person, 'findFirst').mockResolvedValueOnce(null);

      await expect(service.inactivate(999)).rejects.toThrow(NotFoundException);
    });
  });
});
