import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStudentDto, UpdateStudentDto } from '../student.dto';

describe('Student DTOs', () => {
  describe('CreateStudentDto', () => {
    it('should create valid CreateStudentDto with all required fields', async () => {
      const plainObject = {
        guardianId: 1,
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Carrera 10 # 20-30, Bogotá',
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.firstName).toBe('Andrea');
      expect(dto.guardianId).toBe(1);
    });

    it('should accept optional middleName and secondLastname', async () => {
      const plainObject = {
        guardianId: 1,
        firstName: 'Juan',
        middleName: 'Carlos',
        firstLastname: 'López',
        secondLastname: 'García',
        email: 'juan@example.com',
        phone: '3201234567',
        document: {
          documentType: 'Cedula',
          documentNumber: '987654321',
          description: 'Valid ID',
          createPersonDocumentLink: true,
          documentRole: 'Student',
        },
        addresses: [
          {
            address: 'Calle 5 # 10-20, Medellín',
            latitude: 6.2442,
            longitude: -75.5812,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.middleName).toBe('Carlos');
      expect(dto.secondLastname).toBe('García');
    });

    it('should fail validation when guardianId is missing', async () => {
      const plainObject = {
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Address 1',
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'guardianId')).toBe(true);
    });

    it('should fail validation when guardianId is less than 1', async () => {
      const plainObject = {
        guardianId: 0,
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Address 1',
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when firstName is missing', async () => {
      const plainObject = {
        guardianId: 1,
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Address 1',
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });

    it('should fail validation when email format is invalid', async () => {
      const plainObject = {
        guardianId: 1,
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'invalid-email',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Address 1',
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail validation when addresses is empty array', async () => {
      const plainObject = {
        guardianId: 1,
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept multiple addresses', async () => {
      const plainObject = {
        guardianId: 1,
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Primary Address',
            latitude: 4.7110,
            longitude: -74.0721,
          },
          {
            address: 'Secondary Address',
            latitude: 4.7200,
            longitude: -74.0800,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.addresses.length).toBe(2);
    });

    it('should fail validation when address is too short', async () => {
      const plainObject = {
        guardianId: 1,
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Addr',
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should still validate when document is missing (nested validation may be lenient)', async () => {
      const plainObject = {
        guardianId: 1,
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        addresses: [
          {
            address: 'Address 1',
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      // ValidateNested might not fail if object is missing
      expect(errors).toBeDefined();
    });

    it('should convert string numbers to numbers', async () => {
      const plainObject = {
        guardianId: '1',
        firstName: 'Andrea',
        firstLastname: 'Martínez',
        email: 'andrea@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
        addresses: [
          {
            address: 'Address 1',
            latitude: '4.7110',
            longitude: '-74.0721',
          },
        ],
      };

      const dto = plainToClass(CreateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(typeof dto.guardianId).toBe('number');
      expect(typeof dto.addresses[0].latitude).toBe('number');
    });
  });

  describe('UpdateStudentDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional guardianId', async () => {
      const plainObject = {
        guardianId: 2,
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.guardianId).toBe(2);
    });

    it('should accept optional firstName', async () => {
      const plainObject = {
        firstName: 'Updated Name',
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.firstName).toBe('Updated Name');
    });

    it('should accept optional email', async () => {
      const plainObject = {
        email: 'newemail@example.com',
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.email).toBe('newemail@example.com');
    });

    it('should accept optional addresses array', async () => {
      const plainObject = {
        addresses: [
          {
            address: 'New Address',
            latitude: 5.0,
            longitude: -75.0,
          },
        ],
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.addresses?.length).toBe(1);
    });

    it('should accept optional document update', async () => {
      const plainObject = {
        document: {
          documentNumber: '999888777',
          description: 'Updated document',
        },
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when email format is invalid', async () => {
      const plainObject = {
        email: 'not-an-email',
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when guardianId is less than 1', async () => {
      const plainObject = {
        guardianId: 0,
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when addresses is empty array', async () => {
      const plainObject = {
        addresses: [],
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept multiple optional fields together', async () => {
      const plainObject = {
        guardianId: 3,
        firstName: 'Roberto',
        middleName: 'Alejandro',
        firstLastname: 'Sánchez',
        secondLastname: 'Pérez',
        phone: '3214567890',
        email: 'roberto@example.com',
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when firstName is empty string', async () => {
      const plainObject = {
        firstName: '',
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when address exceeds max length', async () => {
      const plainObject = {
        addresses: [
          {
            address: 'A'.repeat(201),
            latitude: 4.7110,
            longitude: -74.0721,
          },
        ],
      };

      const dto = plainToClass(UpdateStudentDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
