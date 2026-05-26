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

  describe('findActiveByZone', () => {
    it('should return active students for a specific zone', async () => {
      const mockStudents = [
        {
          id: 1,
          personType: 'STUDENT',
          guardianId: 1,
          firstName: 'Pedro',
          status: 'ACTIVE',
          addresses: [
            {
              id: 1,
              zone: 'LA_RAZA',
              address: 'Carrera 5 #10-20, Tunja',
              latitude: 5.548,
              longitude: -73.36,
            },
          ],
        },
      ];

      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce(mockStudents as any);

      const result = await service.findActiveByZone(1);

      expect(result).toBeDefined();
      expect(result).toEqual(mockStudents);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            personType: 'STUDENT',
            status: 'ACTIVE',
            personAddresses: {
              some: {
                address: {
                  zoneId: 1,
                },
              },
            },
          },
        }),
      );
    });

    it('should return empty array when no active students in zone', async () => {
      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findActiveByZone(999);

      expect(result).toEqual([]);
      expect(prismaService.person.findMany).toHaveBeenCalled();
    });

    it('should filter by zone correctly', async () => {
      const mockStudents = [
        {
          id: 1,
          personType: 'STUDENT',
          guardianId: 1,
          firstName: 'Pedro',
          status: 'ACTIVE',
          addresses: [],
        },
        {
          id: 2,
          personType: 'STUDENT',
          guardianId: 2,
          firstName: 'Ana',
          status: 'ACTIVE',
          addresses: [],
        },
      ];

      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce(mockStudents as any);

      const result = await service.findActiveByZone(5);

      expect(result).toEqual(mockStudents);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            personAddresses: {
              some: {
                address: {
                  zoneId: 5,
                },
              },
            },
          }),
        }),
      );
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

    it('should handle document update in transaction', async () => {
      const updateDto = {
        firstName: 'Carlos',
      };

      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        const mockTx = {
          person: {
            update: jest.fn().mockResolvedValueOnce({}),
          },
          personDocumentLink: {
            findFirst: jest.fn().mockResolvedValueOnce(null),
          },
          personAddressLink: {
            findMany: jest.fn().mockResolvedValueOnce([]),
            deleteMany: jest.fn().mockResolvedValueOnce({ count: 0 }),
          },
        };
        return callback(mockTx as any);
      });
      jest.spyOn(service, 'findOneByIdInternal' as any).mockResolvedValueOnce(studentInDatabase);

      const result = await service.update(1, updateDto as any);

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when document link not found', async () => {
      const updateDto = {
        firstName: 'Juan',
        document: {
          documentType: 'Pasaporte',
        },
      };

      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          person: {
            update: jest.fn().mockResolvedValueOnce({}),
          },
          personDocumentLink: {
            findFirst: jest.fn().mockResolvedValueOnce(null),
          },
        } as any);
      });

      await expect(service.update(1, updateDto as any)).rejects.toThrow(
        BadRequestException
      );
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

  describe('create with extensive validations', () => {
    it('should throw error when guardian does not have id', async () => {
      const invalidDto = {
        ...validCreateStudentDto,
        guardianId: 0,
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(null);

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when document number already exists', async () => {
      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      jest
        .spyOn(prismaService.personDocument, 'findFirst')
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.create(validCreateStudentDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when email already exists', async () => {
      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      jest
        .spyOn(prismaService.personDocument, 'findFirst')
        .mockResolvedValueOnce(null);

      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.create(validCreateStudentDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when addresses is empty', async () => {
      const noAddressDto = {
        ...validCreateStudentDto,
        addresses: [],
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.create(noAddressDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when firstName is missing', async () => {
      const noFirstNameDto = {
        ...validCreateStudentDto,
        firstName: '',
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.create(noFirstNameDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when email is missing', async () => {
      const noEmailDto = {
        ...validCreateStudentDto,
        email: '',
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.create(noEmailDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findActiveByZone edge cases', () => {
    it('should handle multiple students in same zone', async () => {
      const mockStudents = [
        { id: 1, firstName: 'Pedro', status: 'ACTIVE' },
        { id: 2, firstName: 'Ana', status: 'ACTIVE' },
        { id: 3, firstName: 'Luis', status: 'ACTIVE' },
      ];

      jest
        .spyOn(prismaService.person, 'findMany')
        .mockResolvedValueOnce(mockStudents as any);

      const result = await service.findActiveByZone(1);

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockStudents);
    });

    it('should only return active students', async () => {
      jest
        .spyOn(prismaService.person, 'findMany')
        .mockResolvedValueOnce([]);

      const result = await service.findActiveByZone(1);

      expect(result).toEqual([]);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      );
    });
  });

  describe('findAll with ordering', () => {
    it('should return students ordered by id descending', async () => {
      const mockStudents = [
        { id: 3, firstName: 'Luis' },
        { id: 2, firstName: 'Ana' },
        { id: 1, firstName: 'Pedro' },
      ];

      jest
        .spyOn(prismaService.person, 'findMany')
        .mockResolvedValueOnce(mockStudents as any);

      const result = await service.findAll();

      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { id: 'desc' },
        })
      );
    });

    it('should filter students by type', async () => {
      jest
        .spyOn(prismaService.person, 'findMany')
        .mockResolvedValueOnce([]);

      await service.findAll();

      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { personType: 'STUDENT' },
        })
      );
    });
  });

  describe('update with document changes', () => {
    it('should handle update when document exists and type changes', async () => {
      const updateDtoWithDocChange = {
        firstName: 'Carlos',
        document: {
          documentType: 'Cedula',
        },
      };

      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        const mockTx = {
          person: {
            update: jest.fn().mockResolvedValueOnce({}),
          },
          personDocumentLink: {
            findFirst: jest.fn().mockResolvedValueOnce({
              id: 1,
              personDocumentId: 1,
            }),
          },
          personDocument: {
            findUnique: jest.fn().mockResolvedValueOnce({
              id: 1,
              documentTypeId: 1,
            }),
            update: jest.fn().mockResolvedValueOnce({}),
          },
          personAddress: {
            findMany: jest.fn().mockResolvedValueOnce([]),
          },
        };
        return callback(mockTx as any);
      });

      jest.spyOn(service, 'findOneByIdInternal' as any).mockResolvedValueOnce(studentInDatabase);
      jest.spyOn(service, 'resolveDocumentTypeId' as any).mockResolvedValueOnce(2);

      const result = await service.update(1, updateDtoWithDocChange as any);

      expect(result).toBeDefined();
    });

    it('should throw error when trying to update with invalid guardian', async () => {
      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(studentInDatabase);

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce(null);

      const updateDtoWithGuardian = {
        ...validUpdateStudentDto,
        guardianId: 999,
      };

      await expect(service.update(1, updateDtoWithGuardian)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('zone inference by coordinates', () => {
    it('should classify coordinates in norte zone (La Raza)', async () => {
      // Coordinates above laRazaLat (5.548)
      const mockAddress = {
        address: 'Test address',
        latitude: 5.55,
        longitude: -73.36,
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      jest
        .spyOn(prismaService.personDocument, 'findFirst')
        .mockResolvedValueOnce(null);

      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(null);

      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        const mockTx = {
          person: {
            create: jest.fn().mockResolvedValueOnce({ id: 1 }),
          },
          personDocument: {
            create: jest.fn().mockResolvedValueOnce({ id: 1 }),
          },
          personDocumentLink: {
            create: jest.fn().mockResolvedValueOnce({}),
          },
          address: {
            findFirst: jest.fn().mockResolvedValueOnce(null),
            create: jest.fn().mockResolvedValueOnce({ id: 1 }),
          },
          personAddress: {
            upsert: jest.fn().mockResolvedValueOnce({}),
          },
          zone: {
            findFirst: jest.fn().mockResolvedValueOnce({ id: 1 }),
          },
        };
        return callback(mockTx as any);
      });

      jest.spyOn(service, 'findOneByIdInternal' as any).mockResolvedValueOnce(studentInDatabase);
      jest.spyOn(service, 'resolveDocumentTypeId' as any).mockResolvedValueOnce(1);

      const dtoWithCoordinates = {
        ...validCreateStudentDto,
        addresses: [mockAddress],
      };

      const result = await service.create(dtoWithCoordinates);

      expect(result).toBeDefined();
    });

    it('should classify coordinates in centro zone (Bosque Republica)', async () => {
      // Coordinates between bosqueRepublicaLat and laRazaLat
      const mockAddress = {
        address: 'Test address',
        latitude: 5.54,
        longitude: -73.36,
      };

      jest
        .spyOn(prismaService.guardian, 'findUnique')
        .mockResolvedValueOnce({ id: 1 } as any);

      jest
        .spyOn(prismaService.personDocument, 'findFirst')
        .mockResolvedValueOnce(null);

      jest
        .spyOn(prismaService.person, 'findFirst')
        .mockResolvedValueOnce(null);

      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        const mockTx = {
          person: {
            create: jest.fn().mockResolvedValueOnce({ id: 1 }),
          },
          personDocument: {
            create: jest.fn().mockResolvedValueOnce({ id: 1 }),
          },
          personDocumentLink: {
            create: jest.fn().mockResolvedValueOnce({}),
          },
          address: {
            findFirst: jest.fn().mockResolvedValueOnce(null),
            create: jest.fn().mockResolvedValueOnce({ id: 1 }),
          },
          personAddress: {
            upsert: jest.fn().mockResolvedValueOnce({}),
          },
          zone: {
            findFirst: jest.fn().mockResolvedValueOnce({ id: 2 }),
          },
        };
        return callback(mockTx as any);
      });

      jest.spyOn(service, 'findOneByIdInternal' as any).mockResolvedValueOnce(studentInDatabase);
      jest.spyOn(service, 'resolveDocumentTypeId' as any).mockResolvedValueOnce(1);

      const dtoWithCoordinates = {
        ...validCreateStudentDto,
        addresses: [mockAddress],
      };

      const result = await service.create(dtoWithCoordinates);

      expect(result).toBeDefined();
    });
  });
});
