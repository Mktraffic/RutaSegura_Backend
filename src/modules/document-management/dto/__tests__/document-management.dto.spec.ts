import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
  CreatePersonDocumentDto,
  UpdatePersonDocumentDto,
  CreateVehicleDocumentDto,
  UpdateVehicleDocumentDto,
  AlertQueryDto,
} from '../document-management.dto';

describe('Document Management DTOs', () => {
  describe('CreateDocumentTypeDto', () => {
    it('should create valid CreateDocumentTypeDto', async () => {
      const plainObject = {
        name: 'Cedula',
      };

      const dto = plainToClass(CreateDocumentTypeDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.name).toBe('Cedula');
    });

    it('should fail validation when name is missing', async () => {
      const plainObject = {};

      const dto = plainToClass(CreateDocumentTypeDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail validation when name is too short', async () => {
      const plainObject = {
        name: 'C',
      };

      const dto = plainToClass(CreateDocumentTypeDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when name exceeds max length', async () => {
      const plainObject = {
        name: 'A'.repeat(51),
      };

      const dto = plainToClass(CreateDocumentTypeDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateDocumentTypeDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdateDocumentTypeDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional name', async () => {
      const plainObject = {
        name: 'Pasaporte',
      };

      const dto = plainToClass(UpdateDocumentTypeDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.name).toBe('Pasaporte');
    });

    it('should fail validation when name is too short', async () => {
      const plainObject = {
        name: 'A',
      };

      const dto = plainToClass(UpdateDocumentTypeDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreatePersonDocumentDto', () => {
    it('should create valid CreatePersonDocumentDto', async () => {
      const plainObject = {
        personId: 1,
        documentType: 'Cedula',
        documentNumber: '123456789',
      };

      const dto = plainToClass(CreatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.personId).toBe(1);
    });

    it('should accept optional fields with valid dates', async () => {
      const plainObject = {
        personId: 2,
        documentType: 'Cedula',
        documentNumber: '987654321',
        description: 'National ID',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        fileUrl: 'https://example.com/doc.pdf',
        documentRole: 'STUDENT',
      };

      const dto = plainToClass(CreatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.documentRole).toBe('STUDENT');
    });

    it('should fail validation when personId is missing', async () => {
      const plainObject = {
        documentType: 'Cedula',
        documentNumber: '123456789',
      };

      const dto = plainToClass(CreatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'personId')).toBe(true);
    });

    it('should fail validation when personId is less than 1', async () => {
      const plainObject = {
        personId: 0,
        documentType: 'Cedula',
        documentNumber: '123456789',
      };

      const dto = plainToClass(CreatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when documentNumber is too short', async () => {
      const plainObject = {
        personId: 1,
        documentType: 'Cedula',
        documentNumber: '12',
      };

      const dto = plainToClass(CreatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should convert string numbers to numbers', async () => {
      const plainObject = {
        personId: '1',
        documentType: 'Cedula',
        documentNumber: '123456789',
      };

      const dto = plainToClass(CreatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(typeof dto.personId).toBe('number');
    });
  });

  describe('UpdatePersonDocumentDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional documentNumber', async () => {
      const plainObject = {
        documentNumber: '111222333',
      };

      const dto = plainToClass(UpdatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.documentNumber).toBe('111222333');
    });

    it('should accept optional status', async () => {
      const plainObject = {
        status: 'EXPIRED',
      };

      const dto = plainToClass(UpdatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.status).toBe('EXPIRED');
    });

    it('should fail validation when documentNumber is too short', async () => {
      const plainObject = {
        documentNumber: '12',
      };

      const dto = plainToClass(UpdatePersonDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('CreateVehicleDocumentDto', () => {
    it('should create valid CreateVehicleDocumentDto', async () => {
      const plainObject = {
        vehiclePlate: 'ABC-1234',
        documentType: 'SOAT',
        documentNumber: 'SOAT-001',
      };

      const dto = plainToClass(CreateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.vehiclePlate).toBe('ABC-1234');
      expect(dto.documentType).toBe('SOAT');
    });

    it('should accept all valid document types', async () => {
      const documentTypes = [
        'SOAT',
        'TECHNICAL_INSPECTION',
        'INSURANCE',
        'PROPERTY_CARD',
      ];

      for (const docType of documentTypes) {
        const plainObject = {
          vehiclePlate: 'XYZ-5678',
          documentType: docType,
          documentNumber: `${docType}-001`,
        };

        const dto = plainToClass(CreateVehicleDocumentDto, plainObject);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      }
    });

    it('should accept optional dates and fileUrl', async () => {
      const plainObject = {
        vehiclePlate: 'ABC-1234',
        documentType: 'SOAT',
        documentNumber: 'SOAT-001',
        issueDate: '2024-01-01',
        expiryDate: '2025-01-01',
        fileUrl: 'https://example.com/soat.pdf',
      };

      const dto = plainToClass(CreateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when vehiclePlate exceeds max length', async () => {
      const plainObject = {
        vehiclePlate: 'ABC-1234-EXTRA-LONGGG',
        documentType: 'SOAT',
        documentNumber: 'SOAT-001',
      };

      const dto = plainToClass(CreateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when documentType is invalid', async () => {
      const plainObject = {
        vehiclePlate: 'ABC-1234',
        documentType: 'INVALID',
        documentNumber: 'SOAT-001',
      };

      const dto = plainToClass(CreateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'documentType')).toBe(true);
    });

    it('should fail validation when documentNumber is too short', async () => {
      const plainObject = {
        vehiclePlate: 'ABC-1234',
        documentType: 'SOAT',
        documentNumber: 'SA',
      };

      const dto = plainToClass(CreateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateVehicleDocumentDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional documentNumber', async () => {
      const plainObject = {
        documentNumber: 'SOAT-UPDATED',
      };

      const dto = plainToClass(UpdateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.documentNumber).toBe('SOAT-UPDATED');
    });

    it('should accept optional dates', async () => {
      const plainObject = {
        issueDate: '2024-06-01',
        expiryDate: '2025-06-01',
      };

      const dto = plainToClass(UpdateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional status', async () => {
      const plainObject = {
        status: 'EXPIRED',
      };

      const dto = plainToClass(UpdateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.status).toBe('EXPIRED');
    });

    it('should fail validation when documentNumber is too short', async () => {
      const plainObject = {
        documentNumber: 'SA',
      };

      const dto = plainToClass(UpdateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when status exceeds max length', async () => {
      const plainObject = {
        status: 'A'.repeat(21),
      };

      const dto = plainToClass(UpdateVehicleDocumentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('AlertQueryDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional daysAhead', async () => {
      const plainObject = {
        daysAhead: 30,
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.daysAhead).toBe(30);
    });

    it('should accept optional personId', async () => {
      const plainObject = {
        personId: 5,
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.personId).toBe(5);
    });

    it('should accept optional vehiclePlate', async () => {
      const plainObject = {
        vehiclePlate: 'ABC-1234',
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.vehiclePlate).toBe('ABC-1234');
    });

    it('should accept optional isRead as boolean', async () => {
      const plainObject = {
        isRead: true,
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.isRead).toBe(true);
    });

    it('should accept valid alertType', async () => {
      const plainObject = {
        alertType: 'EXPIRY_WARNING',
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.alertType).toBe('EXPIRY_WARNING');
    });

    it('should fail validation when daysAhead is less than 1', async () => {
      const plainObject = {
        daysAhead: 0,
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when personId is less than 1', async () => {
      const plainObject = {
        personId: 0,
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid alertType', async () => {
      const plainObject = {
        alertType: 'INVALID_TYPE',
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept multiple optional fields together', async () => {
      const plainObject = {
        daysAhead: 60,
        personId: 3,
        vehiclePlate: 'XYZ-5678',
        isRead: false,
        alertType: 'EXPIRY_INFO',
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should convert string numbers to numbers', async () => {
      const plainObject = {
        daysAhead: '30',
        personId: '5',
      };

      const dto = plainToClass(AlertQueryDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(typeof dto.daysAhead).toBe('number');
      expect(typeof dto.personId).toBe('number');
    });
  });
});
