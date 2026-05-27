import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentManagementService } from '../document-management.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  validCreateDocumentTypeDto,
  updateDocumentTypeDto,
  documentTypeInDatabase,
  documentTypeInDatabaseList,
  validCreatePersonDocumentDto,
  updatePersonDocumentDto,
  personDocumentInDatabase,
  documentTypeAlreadyExistsError,
} from './fixtures/document-management.fixture';

describe('DocumentManagementService', () => {
  let service: DocumentManagementService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentManagementService,
        {
          provide: PrismaService,
          useValue: {
            documentType: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            personDocument: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            personDocumentLink: {
              create: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
            vehicleDocument: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            documentAlert: {
              findMany: jest.fn().mockResolvedValue([]),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              createMany: jest.fn(),
              deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
              count: jest.fn().mockResolvedValue(0),
            },
            person: {
              findUnique: jest.fn(),
            },
            vehicle: {
              findUnique: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation((cb) => {
              if (typeof cb === 'function') {
                return cb(prismaService);
              }
              if (Array.isArray(cb)) {
                return Promise.all(cb);
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentManagementService>(DocumentManagementService);
    prismaService = module.get<PrismaService>(PrismaService) as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDocumentTypes', () => {
    it('should return all document types without query', async () => {
      jest
        .spyOn(prismaService.documentType, 'findMany')
        .mockResolvedValueOnce(documentTypeInDatabaseList);

      const result = await service.findDocumentTypes();

      expect(result).toEqual(documentTypeInDatabaseList);
      expect(prismaService.documentType.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { name: 'asc' },
      });
    });

    it('should return filtered document types with query', async () => {
      jest
        .spyOn(prismaService.documentType, 'findMany')
        .mockResolvedValueOnce([documentTypeInDatabaseList[1]]);

      const result = await service.findDocumentTypes('Pasaporte');

      expect(result).toEqual([documentTypeInDatabaseList[1]]);
      expect(prismaService.documentType.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Pasaporte', mode: 'insensitive' },
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('createDocumentType', () => {
    it('should create a document type successfully', async () => {
      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce(null);
      jest
        .spyOn(prismaService.documentType, 'create')
        .mockResolvedValueOnce(documentTypeInDatabase);

      const result = await service.createDocumentType(validCreateDocumentTypeDto);

      expect(result).toEqual(documentTypeInDatabase);
      expect(prismaService.documentType.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if document type already exists', async () => {
      jest
        .spyOn(prismaService.documentType, 'findFirst')
        .mockResolvedValueOnce({ id: 1 } as any);

      await expect(service.createDocumentType(validCreateDocumentTypeDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateDocumentType', () => {
    it('should update a document type successfully', async () => {
      const id = 1;
      jest.spyOn(prismaService.documentType, 'findUnique').mockResolvedValueOnce({
        ...documentTypeInDatabase,
      });
      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.documentType, 'update').mockResolvedValueOnce({
        ...documentTypeInDatabase,
        name: updateDocumentTypeDto.name,
      });

      const result = await service.updateDocumentType(id, updateDocumentTypeDto);

      expect(result).toBeDefined();
      expect(prismaService.documentType.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if document type does not exist', async () => {
      const id = 999;
      jest.spyOn(prismaService.documentType, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.updateDocumentType(id, updateDocumentTypeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if updating to existing name', async () => {
      const id = 1;
      jest
        .spyOn(prismaService.documentType, 'findUnique')
        .mockResolvedValueOnce(documentTypeInDatabase);
      jest
        .spyOn(prismaService.documentType, 'findFirst')
        .mockResolvedValueOnce({ id: 2 } as any);

      await expect(service.updateDocumentType(id, updateDocumentTypeDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createPersonDocument', () => {
    it('should create a person document successfully', async () => {
      const mockTransaction = jest.fn().mockResolvedValueOnce(personDocumentInDatabase);
      jest.spyOn(prismaService, '$transaction' as any).mockImplementationOnce(mockTransaction);
      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce({
        id: 1,
      } as any);
      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce({
        id: 1,
      } as any);
      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce(null);

      const result = await service.createPersonDocument(validCreatePersonDocumentDto);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if person does not exist', async () => {
      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.createPersonDocument(validCreatePersonDocumentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPersonDocuments', () => {
    it('should return all person documents without query', async () => {
      jest.spyOn(prismaService.personDocument, 'findMany').mockResolvedValueOnce([
        personDocumentInDatabase,
      ]);

      const result = await service.findPersonDocuments();

      expect(result).toBeDefined();
      expect(prismaService.personDocument.findMany).toHaveBeenCalled();
    });

    it('should return filtered person documents with query', async () => {
      jest.spyOn(prismaService.personDocument, 'findMany').mockResolvedValueOnce([
        personDocumentInDatabase,
      ]);

      const result = await service.findPersonDocuments('DOC123456');

      expect(result).toBeDefined();
      expect(prismaService.personDocument.findMany).toHaveBeenCalled();
    });
  });

  describe('updatePersonDocument', () => {
    it('should update a person document successfully', async () => {
      const id = 1;
      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce({
        id: 1,
      } as any);
      jest.spyOn(prismaService.personDocument, 'update').mockResolvedValueOnce({
        ...personDocumentInDatabase,
        documentNumber: updatePersonDocumentDto.documentNumber,
      } as any);

      const result = await service.updatePersonDocument(id, updatePersonDocumentDto);

      expect(result).toBeDefined();
      expect(prismaService.personDocument.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if document does not exist', async () => {
      const id = 999;
      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.updatePersonDocument(id, updatePersonDocumentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('inactivatePersonDocument', () => {
    it('should inactivate a person document successfully', async () => {
      const id = 1;
      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce({
        id: 1,
        status: 'ACTIVE',
      } as any);
      jest.spyOn(prismaService.personDocument, 'update').mockResolvedValueOnce({
        ...personDocumentInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await service.inactivatePersonDocument(id);

      expect(result).toBeDefined();
      expect(prismaService.personDocument.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if document does not exist', async () => {
      const id = 999;
      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.inactivatePersonDocument(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createVehicleDocument', () => {
    it('should create a vehicle document successfully', async () => {
      const dto = {
        vehiclePlate: 'ABC-123',
        documentType: 'SOAT' as const,
        documentNumber: 'VEH123456',
        issueDate: '2020-01-15T00:00:00Z',
        expiryDate: '2025-01-15T00:00:00Z',
        fileUrl: 'https://example.com/soat.pdf',
      };

      const mockVehicle = { plate: 'ABC-123', status: 'ACTIVE' };
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(mockVehicle as any);
      jest.spyOn(prismaService.vehicleDocument, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService, '$transaction').mockImplementation(async (callback) => {
        return callback({
          vehicleDocument: {
            create: jest.fn().mockResolvedValueOnce({
              id: 1,
              ...dto,
            }),
            findUnique: jest.fn().mockResolvedValueOnce({
              id: 1,
              ...dto,
            }),
          },
          vehicle: {
            update: jest.fn().mockResolvedValueOnce({}),
          },
        } as any);
      });
      jest.spyOn(service, 'refreshVehicleDocumentAlerts' as any).mockResolvedValueOnce(undefined);

      const result = await service.createVehicleDocument(dto);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('should throw BadRequestException if vehicle is inactive', async () => {
      const dto = {
        vehiclePlate: 'ABC-123',
        documentType: 'SOAT' as const,
        documentNumber: 'VEH123456',
        issueDate: '2020-01-15T00:00:00Z',
        expiryDate: '2025-01-15T00:00:00Z',
        fileUrl: 'https://example.com/soat.pdf',
      };

      const mockInactiveVehicle = { plate: 'ABC-123', status: 'INACTIVE' };
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(mockInactiveVehicle as any);

      await expect(service.createVehicleDocument(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if vehicle does not exist', async () => {
      const dto = {
        vehiclePlate: 'XYZ-999',
        documentType: 'SOAT' as const,
        documentNumber: 'VEH123456',
        issueDate: '2020-01-15T00:00:00Z',
        expiryDate: '2025-01-15T00:00:00Z',
        fileUrl: 'https://example.com/soat.pdf',
      };

      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.createVehicleDocument(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findVehicleDocuments', () => {
    it('should return all vehicle documents without query', async () => {
      const mockDocuments = [
        {
          id: 1,
          vehiclePlate: 'ABC-123',
          documentType: 'SOAT',
          documentNumber: 'VEH123456',
        },
        {
          id: 2,
          vehiclePlate: 'XYZ-456',
          documentType: 'INSURANCE',
          documentNumber: 'INS789012',
        },
      ];

      jest.spyOn(prismaService.vehicleDocument, 'findMany').mockResolvedValueOnce(mockDocuments as any);

      const result = await service.findVehicleDocuments();

      expect(result).toEqual(mockDocuments);
      expect(prismaService.vehicleDocument.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { id: 'desc' },
      });
    });

    it('should return filtered vehicle documents with query', async () => {
      const query = 'ABC';
      const mockDocuments = [
        {
          id: 1,
          vehiclePlate: 'ABC-123',
          documentType: 'SOAT',
          documentNumber: 'VEH123456',
        },
      ];

      jest.spyOn(prismaService.vehicleDocument, 'findMany').mockResolvedValueOnce(mockDocuments as any);

      const result = await service.findVehicleDocuments(query);

      expect(result).toEqual(mockDocuments);
      expect(prismaService.vehicleDocument.findMany).toHaveBeenCalled();
    });
  });

  describe('updateVehicleDocument', () => {
    it('should update a vehicle document successfully', async () => {
      const id = 1;
      const dto = {
        documentNumber: 'VEH789012',
        expiryDate: '2026-01-15T00:00:00Z',
      };

      const currentDocument = {
        id: 1,
        documentType: 'SOAT' as const,
        documentNumber: 'VEH123456',
        status: 'ACTIVE',
      };

      jest.spyOn(prismaService.vehicleDocument, 'findUnique').mockResolvedValueOnce(currentDocument as any);
      jest.spyOn(prismaService.vehicleDocument, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.vehicleDocument, 'update').mockResolvedValueOnce({
        ...currentDocument,
        ...dto,
      } as any);
      jest.spyOn(service, 'refreshVehicleDocumentAlerts' as any).mockResolvedValueOnce(undefined);

      const result = await service.updateVehicleDocument(id, dto as any);

      expect(result).toBeDefined();
      expect(prismaService.vehicleDocument.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          documentNumber: dto.documentNumber,
          expiryDate: new Date(dto.expiryDate),
          issueDate: undefined,
          fileUrl: undefined,
          status: undefined,
        },
      });
    });

    it('should throw NotFoundException if document does not exist', async () => {
      const id = 999;
      jest.spyOn(prismaService.vehicleDocument, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.updateVehicleDocument(id, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('inactivateVehicleDocument', () => {
    it('should inactivate a vehicle document successfully', async () => {
      const id = 1;
      const currentDocument = {
        id: 1,
        documentType: 'SOAT',
        status: 'ACTIVE',
      };

      const inactivatedDocument = {
        ...currentDocument,
        status: 'INACTIVE',
      };

      jest.spyOn(prismaService.vehicleDocument, 'findUnique').mockResolvedValueOnce(currentDocument as any);
      jest.spyOn(prismaService.vehicleDocument, 'update').mockResolvedValueOnce(inactivatedDocument as any);
      jest.spyOn(service, 'refreshVehicleDocumentAlerts' as any).mockResolvedValueOnce(undefined);

      const result = await service.inactivateVehicleDocument(id);

      expect(result).toBeDefined();
      expect(result.status).toBe('INACTIVE');
      expect(prismaService.vehicleDocument.update).toHaveBeenCalledWith({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    });

    it('should throw BadRequestException if vehicle document is already inactive', async () => {
      const id = 1;
      const currentDocument = {
        id: 1,
        documentType: 'SOAT',
        status: 'INACTIVE',
      };

      jest.spyOn(prismaService.vehicleDocument, 'findUnique').mockResolvedValueOnce(currentDocument as any);

      await expect(service.inactivateVehicleDocument(id)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if document does not exist', async () => {
      const id = 999;
      jest.spyOn(prismaService.vehicleDocument, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.inactivateVehicleDocument(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateExpiryAlerts', () => {
    it('should generate expiry alerts with specified days ahead', async () => {
      jest.spyOn(prismaService.documentAlert, 'createMany').mockResolvedValueOnce({
        count: 5,
      });

      const result = await service.generateExpiryAlerts(30);

      expect(result).toBeDefined();
    });
  });

  describe('findAlerts', () => {
    it('should return all alerts', async () => {
      jest.spyOn(prismaService.documentAlert, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findAlerts({} as any);

      expect(result).toBeDefined();
      expect(prismaService.documentAlert.findMany).toHaveBeenCalled();
    });
  });

  describe('markAlertAsRead', () => {
    it('should mark an alert as read', async () => {
      const id = 1;
      jest.spyOn(prismaService.documentAlert, 'findUnique').mockResolvedValueOnce({
        id: 1,
        isRead: false,
      } as any);
      jest.spyOn(prismaService.documentAlert, 'update').mockResolvedValueOnce({
        id: 1,
        isRead: true,
      } as any);

      const result = await service.markAlertAsRead(id);

      expect(result).toBeDefined();
      expect(prismaService.documentAlert.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if alert does not exist', async () => {
      const id = 999;
      jest.spyOn(prismaService.documentAlert, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.markAlertAsRead(id)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if alert is already read', async () => {
      const id = 1;
      jest.spyOn(prismaService.documentAlert, 'findUnique').mockResolvedValueOnce({
        id: 1,
        isRead: true,
      } as any);

      await expect(service.markAlertAsRead(id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('inactivatePersonDocument additional cases', () => {
    it('should throw BadRequestException if document is already inactive', async () => {
      const id = 1;
      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce({
        id: 1,
        status: 'INACTIVE',
      } as any);

      await expect(service.inactivatePersonDocument(id)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if document status is case-insensitive inactive', async () => {
      const id = 1;
      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce({
        id: 1,
        status: 'inactive',
      } as any);

      await expect(service.inactivatePersonDocument(id)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findPersonDocuments with complex queries', () => {
    it('should search by document number', async () => {
      const query = '12345678';
      jest.spyOn(prismaService.personDocument, 'findMany').mockResolvedValueOnce([
        personDocumentInDatabase,
      ] as any);

      const result = await service.findPersonDocuments(query);

      expect(result).toBeDefined();
      expect(prismaService.personDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should search by person first name', async () => {
      const query = 'Juan';
      jest.spyOn(prismaService.personDocument, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findPersonDocuments(query);

      expect(result).toBeDefined();
      expect(prismaService.personDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should return empty array when no documents match query', async () => {
      jest.spyOn(prismaService.personDocument, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findPersonDocuments('NONEXISTENT');

      expect(result).toEqual([]);
    });
  });

  describe('createPersonDocument additional validations', () => {
    it('should throw NotFoundException if person does not exist during creation', async () => {
      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.createPersonDocument(validCreatePersonDocumentDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should create document with all optional fields', async () => {
      const dtoWithAllFields = {
        ...validCreatePersonDocumentDto,
        issueDate: '2024-01-01',
        expiryDate: '2025-01-01',
        fileUrl: 'https://example.com/doc.pdf',
        documentRole: 'SECONDARY',
      };

      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce({
        id: 1,
      } as any);

      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce({
        id: 1,
      } as any);

      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce(null);

      const mockTransaction = jest.fn().mockResolvedValueOnce(personDocumentInDatabase);
      jest
        .spyOn(prismaService, '$transaction' as any)
        .mockImplementationOnce(mockTransaction);

      jest
        .spyOn(service, 'refreshPersonDocumentAlerts' as any)
        .mockResolvedValueOnce(undefined);

      const result = await service.createPersonDocument(dtoWithAllFields as any);

      expect(result).toBeDefined();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('updatePersonDocument with document type changes', () => {
    it('should update document type and validate uniqueness', async () => {
      const id = 1;
      const dtoWithTypeChange = {
        documentType: 'Pasaporte',
        documentNumber: 'NEW123456',
      };

      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce({
        id: 1,
        documentTypeId: 1,
        documentNumber: 'OLD123456',
      } as any);

      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce({
        id: 2,
      } as any);

      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce(null);

      jest.spyOn(prismaService.personDocument, 'update').mockResolvedValueOnce({
        ...personDocumentInDatabase,
        documentTypeId: 2,
        documentNumber: 'NEW123456',
      } as any);

      jest
        .spyOn(service, 'refreshPersonDocumentAlerts' as any)
        .mockResolvedValueOnce(undefined);

      const result = await service.updatePersonDocument(id, dtoWithTypeChange as any);

      expect(result).toBeDefined();
      expect(prismaService.personDocument.update).toHaveBeenCalled();
    });

    it('should keep current document type if not specified in update', async () => {
      const id = 1;
      const dtoWithoutType = {
        documentNumber: 'UPD123456',
      };

      jest.spyOn(prismaService.personDocument, 'findUnique').mockResolvedValueOnce({
        id: 1,
        documentTypeId: 1,
        documentNumber: 'OLD123456',
      } as any);

      jest.spyOn(prismaService.personDocument, 'findFirst').mockResolvedValueOnce(null);

      jest.spyOn(prismaService.personDocument, 'update').mockResolvedValueOnce({
        ...personDocumentInDatabase,
        documentNumber: 'UPD123456',
      } as any);

      jest
        .spyOn(service, 'refreshPersonDocumentAlerts' as any)
        .mockResolvedValueOnce(undefined);

      const result = await service.updatePersonDocument(id, dtoWithoutType as any);

      expect(result).toBeDefined();
      expect(prismaService.personDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id },
          data: expect.objectContaining({
            documentTypeId: 1,
            documentNumber: 'UPD123456',
          }),
        })
      );
    });
  });

  describe('createVehicleDocument edge cases', () => {
    it('should throw BadRequestException if vehicle has duplicate document', async () => {
      const dto = {
        vehiclePlate: 'ABC-123',
        documentType: 'SOAT' as const,
        documentNumber: 'VEH123456',
        issueDate: '2020-01-15T00:00:00Z',
        expiryDate: '2025-01-15T00:00:00Z',
        fileUrl: 'https://example.com/soat.pdf',
      };

      const mockVehicle = { plate: 'ABC-123', status: 'ACTIVE' };
      jest.spyOn(prismaService.vehicle, 'findUnique').mockResolvedValueOnce(mockVehicle as any);

      jest.spyOn(prismaService.vehicleDocument, 'findFirst').mockResolvedValueOnce({
        id: 1,
      } as any);

      await expect(service.createVehicleDocument(dto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle all vehicle document types', async () => {
      const documentTypes: Array<'SOAT' | 'TECHNICAL_INSPECTION' | 'INSURANCE' | 'PROPERTY_CARD'> = [
        'SOAT',
        'TECHNICAL_INSPECTION',
        'INSURANCE',
        'PROPERTY_CARD',
      ];

      for (const docType of documentTypes) {
        const dto = {
          vehiclePlate: 'ABC-123',
          documentType: docType,
          documentNumber: `DOC-${docType}-123`,
          issueDate: '2020-01-15T00:00:00Z',
          expiryDate: '2025-01-15T00:00:00Z',
          fileUrl: 'https://example.com/doc.pdf',
        };

        const mockVehicle = { plate: 'ABC-123', status: 'ACTIVE' };
        jest
          .spyOn(prismaService.vehicle, 'findUnique')
          .mockResolvedValueOnce(mockVehicle as any);

        jest.spyOn(prismaService.vehicleDocument, 'findFirst').mockResolvedValueOnce(null);

        jest.spyOn(prismaService, '$transaction' as any).mockImplementation(async (callback: any) => {
          return callback({
            vehicleDocument: {
              create: jest.fn().mockResolvedValueOnce({
                id: 1,
                ...dto,
              }),
              findUnique: jest.fn().mockResolvedValueOnce({
                id: 1,
                ...dto,
              }),
            },
            vehicle: {
              update: jest.fn().mockResolvedValueOnce({}),
            },
          } as any);
        });

        jest
          .spyOn(service, 'refreshVehicleDocumentAlerts' as any)
          .mockResolvedValueOnce(undefined);

        const result = await service.createVehicleDocument(dto);

        expect(result).toBeDefined();
        jest.clearAllMocks();
      }
    });
  });

  describe('findVehicleDocuments with complex filters', () => {
    it('should search by vehicle plate', async () => {
      const query = 'ABC-123';
      const mockDocuments = [
        {
          id: 1,
          vehiclePlate: 'ABC-123',
          documentType: 'SOAT',
        },
      ];

      jest
        .spyOn(prismaService.vehicleDocument, 'findMany')
        .mockResolvedValueOnce(mockDocuments as any);

      const result = await service.findVehicleDocuments(query);

      expect(result).toBeDefined();
      expect(result).toEqual(mockDocuments);
    });

    it('should search by document type', async () => {
      const query = 'SOAT';
      const mockDocuments = [
        {
          id: 1,
          vehiclePlate: 'ABC-123',
          documentType: 'SOAT',
        },
      ];

      jest
        .spyOn(prismaService.vehicleDocument, 'findMany')
        .mockResolvedValueOnce(mockDocuments as any);

      const result = await service.findVehicleDocuments(query);

      expect(result).toBeDefined();
      expect(prismaService.vehicleDocument.findMany).toHaveBeenCalled();
    });

    it('should handle empty search results', async () => {
      jest.spyOn(prismaService.vehicleDocument, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findVehicleDocuments('NONEXISTENT');

      expect(result).toEqual([]);
    });
  });

  describe('updateVehicleDocument with validation', () => {
    it('should validate document number uniqueness on update', async () => {
      const id = 1;
      const dto = {
        documentNumber: 'VEH789012',
      };

      const currentDocument = {
        id: 1,
        documentType: 'SOAT' as const,
        documentNumber: 'VEH123456',
        status: 'ACTIVE',
      };

      jest
        .spyOn(prismaService.vehicleDocument, 'findUnique')
        .mockResolvedValueOnce(currentDocument as any);

      jest.spyOn(prismaService.vehicleDocument, 'findFirst').mockResolvedValueOnce(null);

      jest.spyOn(prismaService.vehicleDocument, 'update').mockResolvedValueOnce({
        ...currentDocument,
        documentNumber: dto.documentNumber,
      } as any);

      jest
        .spyOn(service, 'refreshVehicleDocumentAlerts' as any)
        .mockResolvedValueOnce(undefined);

      const result = await service.updateVehicleDocument(id, dto as any);

      expect(result).toBeDefined();
      expect(prismaService.vehicleDocument.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if document does not exist on update', async () => {
      const id = 999;
      jest.spyOn(prismaService.vehicleDocument, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.updateVehicleDocument(id, {} as any)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('inactivateVehicleDocument with validations', () => {
    it('should throw BadRequestException if vehicle document is already inactive', async () => {
      const id = 1;
      const currentDocument = {
        id: 1,
        documentType: 'SOAT',
        status: 'INACTIVE',
      };

      jest
        .spyOn(prismaService.vehicleDocument, 'findUnique')
        .mockResolvedValueOnce(currentDocument as any);

      await expect(service.inactivateVehicleDocument(id)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle case-insensitive status check', async () => {
      const id = 1;
      const currentDocument = {
        id: 1,
        documentType: 'SOAT',
        status: 'inactive',
      };

      jest
        .spyOn(prismaService.vehicleDocument, 'findUnique')
        .mockResolvedValueOnce(currentDocument as any);

      await expect(service.inactivateVehicleDocument(id)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('document type creation and updates with edge cases', () => {
    it('should handle document type names with whitespace', async () => {
      const dto = {
        name: '  Cedula de Ciudadania  ',
      };

      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce(null);

      jest.spyOn(prismaService.documentType, 'create').mockResolvedValueOnce({
        id: 1,
        name: 'Cedula de Ciudadania',
      } as any);

      const result = await service.createDocumentType(dto as any);

      expect(result).toBeDefined();
      expect(prismaService.documentType.create).toHaveBeenCalledWith({
        data: {
          name: 'Cedula de Ciudadania',
        },
      });
    });

    it('should throw error when updating to duplicate document type name', async () => {
      const id = 1;
      const dto = {
        name: 'Pasaporte',
      };

      jest.spyOn(prismaService.documentType, 'findUnique').mockResolvedValueOnce({
        id: 1,
        name: 'Cedula',
      } as any);

      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce({
        id: 2,
        name: 'Pasaporte',
      } as any);

      await expect(service.updateDocumentType(id, dto as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should allow updating name to same value (case-insensitive)', async () => {
      const id = 1;
      const dto = {
        name: 'CEDULA',
      };

      jest.spyOn(prismaService.documentType, 'findUnique').mockResolvedValueOnce({
        id: 1,
        name: 'Cedula',
      } as any);

      jest.spyOn(prismaService.documentType, 'findFirst').mockResolvedValueOnce(null);

      jest.spyOn(prismaService.documentType, 'update').mockResolvedValueOnce({
        id: 1,
        name: 'CEDULA',
      } as any);

      const result = await service.updateDocumentType(id, dto as any);

      expect(result).toBeDefined();
      expect(prismaService.documentType.update).toHaveBeenCalled();
    });
  });

  describe('alert generation and management', () => {
    it('should generate expiry alerts with default days ahead', async () => {
      jest
        .spyOn(prismaService.documentAlert, 'createMany')
        .mockResolvedValueOnce({ count: 3 });

      jest
        .spyOn(service, 'syncExpiryAlerts' as any)
        .mockResolvedValueOnce({
          created: 3,
          updated: 0,
          removed: 0,
        });

      const result = await service.generateExpiryAlerts();

      expect(result).toBeDefined();
      expect(result.daysAhead).toBe(30);
    });

    it('should generate expiry alerts with custom days ahead', async () => {
      jest
        .spyOn(service, 'syncExpiryAlerts' as any)
        .mockResolvedValueOnce({
          created: 2,
          updated: 1,
          removed: 0,
        });

      const result = await service.generateExpiryAlerts(60);

      expect(result).toBeDefined();
      expect(result.daysAhead).toBe(60);
    });

    it('should find alerts with pagination', async () => {
      jest
        .spyOn(service, 'syncExpiryAlerts' as any)
        .mockResolvedValueOnce({});

      jest.spyOn(prismaService.documentAlert, 'count').mockResolvedValueOnce(50);

      jest.spyOn(prismaService.documentAlert, 'findMany').mockResolvedValueOnce([
        {
          id: 1,
          alertType: 'EXPIRY_WARNING',
          isRead: false,
          daysRemaining: 15,
        },
      ] as any);

      const result = await service.findAlerts({
        page: 1,
        limit: 20,
      } as any);

      expect(result).toBeDefined();
      expect(result.meta.totalItems).toBe(50);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should handle default pagination values', async () => {
      jest
        .spyOn(service, 'syncExpiryAlerts' as any)
        .mockResolvedValueOnce({});

      jest.spyOn(prismaService.documentAlert, 'count').mockResolvedValueOnce(10);

      jest.spyOn(prismaService.documentAlert, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findAlerts({} as any);

      expect(result).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });
  });
});
