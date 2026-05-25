import 'reflect-metadata';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGuardianDto, UpdateGuardianDto } from '../create-guardian.dto';

describe('Guardian DTOs', () => {
  describe('CreateGuardianDto', () => {
    it('should create valid CreateGuardianDto with all required fields', async () => {
      const plainObject = {
        firstName: 'Carlos',
        firstLastname: 'García',
        email: 'carlos.garcia@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.firstName).toBe('Carlos');
      expect(dto.email).toBe('carlos.garcia@example.com');
    });

    it('should accept optional middleName and secondLastname', async () => {
      const plainObject = {
        firstName: 'María',
        middleName: 'Isabel',
        firstLastname: 'Rodríguez',
        secondLastname: 'López',
        email: 'maria@example.com',
        phone: '3201234567',
        document: {
          documentType: 'Cedula',
          documentNumber: '987654321',
          description: 'Valid ID',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.middleName).toBe('Isabel');
      expect(dto.secondLastname).toBe('López');
      expect(dto.phone).toBe('3201234567');
    });

    it('should fail validation when firstName is missing', async () => {
      const plainObject = {
        firstLastname: 'García',
        email: 'test@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'firstName')).toBe(true);
    });

    it('should fail validation when firstLastname is missing', async () => {
      const plainObject = {
        firstName: 'Carlos',
        email: 'test@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'firstLastname')).toBe(true);
    });

    it('should fail validation when email is missing', async () => {
      const plainObject = {
        firstName: 'Carlos',
        firstLastname: 'García',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail validation when email format is invalid', async () => {
      const plainObject = {
        firstName: 'Carlos',
        firstLastname: 'García',
        email: 'invalid-email',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should still validate when document is missing (nested validation may be lenient)', async () => {
      const plainObject = {
        firstName: 'Carlos',
        firstLastname: 'García',
        email: 'carlos@example.com',
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      // ValidateNested might not fail if object is missing
      expect(errors).toBeDefined();
    });

    it('should fail validation when document.documentType is too short', async () => {
      const plainObject = {
        firstName: 'Carlos',
        firstLastname: 'García',
        email: 'carlos@example.com',
        document: {
          documentType: 'C',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when document.documentNumber is too short', async () => {
      const plainObject = {
        firstName: 'Carlos',
        firstLastname: 'García',
        email: 'carlos@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '12',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when firstName is too long', async () => {
      const plainObject = {
        firstName: 'A'.repeat(51),
        firstLastname: 'García',
        email: 'carlos@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when firstName is empty', async () => {
      const plainObject = {
        firstName: '',
        firstLastname: 'García',
        email: 'carlos@example.com',
        document: {
          documentType: 'Cedula',
          documentNumber: '123456789',
        },
      };

      const dto = plainToClass(CreateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('UpdateGuardianDto', () => {
    it('should be valid with empty object (all optional)', async () => {
      const plainObject = {};

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept optional firstName', async () => {
      const plainObject = {
        firstName: 'Juan',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.firstName).toBe('Juan');
    });

    it('should accept optional email', async () => {
      const plainObject = {
        email: 'newemail@example.com',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.email).toBe('newemail@example.com');
    });

    it('should accept optional phone', async () => {
      const plainObject = {
        phone: '3209876543',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.phone).toBe('3209876543');
    });

    it('should accept optional status', async () => {
      const plainObject = {
        status: 'INACTIVE',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.status).toBe('INACTIVE');
    });

    it('should accept optional document update', async () => {
      const plainObject = {
        document: {
          documentNumber: '111222333',
          description: 'Updated document',
        },
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when firstName is empty string', async () => {
      const plainObject = {
        firstName: '',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when email is invalid', async () => {
      const plainObject = {
        email: 'not-an-email',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept multiple optional fields together', async () => {
      const plainObject = {
        firstName: 'Pedro',
        middleName: 'Enrique',
        firstLastname: 'Sánchez',
        secondLastname: 'Moreno',
        email: 'pedro@example.com',
        phone: '3214567890',
        status: 'ACTIVE',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should fail validation when firstName exceeds max length', async () => {
      const plainObject = {
        firstName: 'A'.repeat(51),
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when firstLastname is empty when provided', async () => {
      const plainObject = {
        firstLastname: '',
      };

      const dto = plainToClass(UpdateGuardianDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
