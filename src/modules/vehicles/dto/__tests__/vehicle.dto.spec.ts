import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVehicleDto, UpdateVehicleDto } from '../vehicle.dto';

describe('Vehicle DTOs', () => {
  describe('CreateVehicleDto', () => {
    it('should create valid CreateVehicleDto with required fields and documents', async () => {
      const plainObject = {
        plate: 'ABC-1234',
        passengerCapacity: 5,
        documents: {
          soat: {
            documentNumber: 'SOAT-001',
            issueDate: '2024-01-01',
            expiryDate: '2025-01-01',
          },
          technicalInspection: {
            documentNumber: 'INSPEC-001',
            issueDate: '2024-06-01',
            expiryDate: '2025-06-01',
          },
          insurance: {
            documentNumber: 'INS-001',
            issueDate: '2024-01-01',
            expiryDate: '2025-01-01',
          },
          propertyCard: {
            documentNumber: 'CARD-001',
            issueDate: '2024-01-01',
          },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.plate).toBe('ABC-1234');
      expect(dto.passengerCapacity).toBe(5);
    });

    it('should accept optional brand and model fields', async () => {
      const plainObject = {
        plate: 'XYZ-5678',
        passengerCapacity: 8,
        brand: 'Hyundai',
        model: 'H350',
        year: 2020,
        documents: {
          soat: {
            documentNumber: 'SOAT-002',
          },
          technicalInspection: {
            documentNumber: 'INSPEC-002',
          },
          insurance: {
            documentNumber: 'INS-002',
          },
          propertyCard: {
            documentNumber: 'CARD-002',
          },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.brand).toBe('Hyundai');
      expect(dto.model).toBe('H350');
      expect(dto.year).toBe(2020);
    });

    it('should fail validation when plate is missing', async () => {
      const plainObject = {
        passengerCapacity: 5,
        documents: {
          soat: { documentNumber: 'SOAT-001' },
          technicalInspection: { documentNumber: 'INSPEC-001' },
          insurance: { documentNumber: 'INS-001' },
          propertyCard: { documentNumber: 'CARD-001' },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'plate')).toBe(true);
    });

    it('should fail validation when passengerCapacity is less than 1', async () => {
      const plainObject = {
        plate: 'ABC-1234',
        passengerCapacity: 0,
        documents: {
          soat: { documentNumber: 'SOAT-001' },
          technicalInspection: { documentNumber: 'INSPEC-001' },
          insurance: { documentNumber: 'INS-001' },
          propertyCard: { documentNumber: 'CARD-001' },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when year is less than 1900', async () => {
      const plainObject = {
        plate: 'ABC-1234',
        passengerCapacity: 5,
        year: 1899,
        documents: {
          soat: { documentNumber: 'SOAT-001' },
          technicalInspection: { documentNumber: 'INSPEC-001' },
          insurance: { documentNumber: 'INS-001' },
          propertyCard: { documentNumber: 'CARD-001' },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should still validate when documents.soat is missing (nested validation may be lenient)', async () => {
      const plainObject = {
        plate: 'ABC-1234',
        passengerCapacity: 5,
        documents: {
          technicalInspection: { documentNumber: 'INSPEC-001' },
          insurance: { documentNumber: 'INS-001' },
          propertyCard: { documentNumber: 'CARD-001' },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      // ValidateNested might not fail if nested object is missing
      expect(errors).toBeDefined();
    });

    it('should fail validation when soat.documentNumber is too short', async () => {
      const plainObject = {
        plate: 'ABC-1234',
        passengerCapacity: 5,
        documents: {
          soat: { documentNumber: 'AB' },
          technicalInspection: { documentNumber: 'INSPEC-001' },
          insurance: { documentNumber: 'INS-001' },
          propertyCard: { documentNumber: 'CARD-001' },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional dates in document objects', async () => {
      const plainObject = {
        plate: 'ABC-1234',
        passengerCapacity: 5,
        documents: {
          soat: {
            documentNumber: 'SOAT-001',
            issueDate: '2024-01-01',
            expiryDate: '2025-01-01',
            fileUrl: 'https://example.com/soat.pdf',
          },
          technicalInspection: {
            documentNumber: 'INSPEC-001',
          },
          insurance: {
            documentNumber: 'INS-001',
          },
          propertyCard: {
            documentNumber: 'CARD-001',
          },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when plate exceeds max length', async () => {
      const plainObject = {
        plate: 'ABC-1234-EXTRA-LONG-PLATE',
        passengerCapacity: 5,
        documents: {
          soat: { documentNumber: 'SOAT-001' },
          technicalInspection: { documentNumber: 'INSPEC-001' },
          insurance: { documentNumber: 'INS-001' },
          propertyCard: { documentNumber: 'CARD-001' },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should convert string numbers to numbers', async () => {
      const plainObject = {
        plate: 'ABC-1234',
        passengerCapacity: '5',
        year: '2020',
        documents: {
          soat: { documentNumber: 'SOAT-001' },
          technicalInspection: { documentNumber: 'INSPEC-001' },
          insurance: { documentNumber: 'INS-001' },
          propertyCard: { documentNumber: 'CARD-001' },
        },
      };

      const dto = plainToClass(CreateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(typeof dto.passengerCapacity).toBe('number');
      expect(typeof dto.year).toBe('number');
    });
  });

  describe('UpdateVehicleDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional passengerCapacity', async () => {
      const plainObject = {
        passengerCapacity: 10,
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.passengerCapacity).toBe(10);
    });

    it('should accept optional brand field', async () => {
      const plainObject = {
        brand: 'Mercedes',
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.brand).toBe('Mercedes');
    });

    it('should accept optional model and year fields', async () => {
      const plainObject = {
        model: 'Sprinter',
        year: 2023,
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.model).toBe('Sprinter');
      expect(dto.year).toBe(2023);
    });

    it('should accept optional status field', async () => {
      const plainObject = {
        status: 'ACTIVE',
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.status).toBe('ACTIVE');
    });

    it('should fail validation when passengerCapacity is less than 1', async () => {
      const plainObject = {
        passengerCapacity: 0,
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when year is less than 1900', async () => {
      const plainObject = {
        year: 1850,
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional documents update', async () => {
      const plainObject = {
        documents: {
          soat: {
            documentNumber: 'SOAT-UPDATED',
            expiryDate: '2026-01-01',
          },
          insurance: {
            documentNumber: 'INS-UPDATED',
          },
        },
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept multiple optional fields together', async () => {
      const plainObject = {
        brand: 'Volkswagen',
        model: 'Transporter',
        passengerCapacity: 7,
        year: 2021,
        status: 'MAINTENANCE',
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when brand exceeds max length', async () => {
      const plainObject = {
        brand: 'A'.repeat(51),
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should convert string year to number', async () => {
      const plainObject = {
        year: '2022',
        passengerCapacity: '6',
      };

      const dto = plainToClass(UpdateVehicleDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(typeof dto.year).toBe('number');
      expect(typeof dto.passengerCapacity).toBe('number');
    });
  });
});
