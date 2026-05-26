import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateDriverDto, UpdateDriverDto } from '../driver.dto';

describe('CreateDriverDto', () => {
  it('should create valid CreateDriverDto with required fields', async () => {
    const plainObject = {
      firstName: 'Juan',
      firstLastname: 'Pérez',
      documents: [
        {
          documentType: 'CC',
          documentNumber: 'ID123456789',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC123456',
        },
      ],
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation when firstName is missing', async () => {
    const plainObject = {
      firstLastname: 'Pérez',
      documents: [
        {
          documentType: 'CC',
          documentNumber: 'ID123456789',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC123456',
        },
      ],
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when firstLastname is missing', async () => {
    const plainObject = {
      firstName: 'Juan',
      documents: [
        {
          documentType: 'CC',
          documentNumber: 'ID123456789',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC123456',
        },
      ],
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when documents are missing', async () => {
    const plainObject = {
      firstName: 'Juan',
      firstLastname: 'Pérez',
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept optional fields', async () => {
    const plainObject = {
      firstName: 'Juan',
      middleName: 'Carlos',
      firstLastname: 'Pérez',
      secondLastname: 'López',
      phone: '+57123456789',
      email: 'juan@example.com',
      documents: [
        {
          documentType: 'CC',
          documentNumber: 'PASS123456',
          description: 'Cedula valida',
          documentRole: 'PRIMARY',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC999',
          description: 'Licencia valida',
          documentRole: 'PRIMARY',
        },
      ],
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation when email format is invalid', async () => {
    const plainObject = {
      firstName: 'Juan',
      firstLastname: 'Pérez',
      email: 'invalid-email',
      documents: [
        {
          documentType: 'CC',
          documentNumber: 'ID123456789',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC123456',
        },
      ],
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when document has invalid type', async () => {
    const plainObject = {
      firstName: 'Juan',
      firstLastname: 'Pérez',
      documents: [
        {
          documentType: 'X',
          documentNumber: 'ID123456789',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC123456',
        },
      ],
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate firstName length constraints', async () => {
    const plainObject = {
      firstName: 'a'.repeat(51),
      firstLastname: 'Pérez',
      documents: [
        {
          documentType: 'CC',
          documentNumber: 'ID123456789',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC123456',
        },
      ],
    };

    const dto = plainToClass(CreateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateDriverDto', () => {
  it('should be valid with only firstName', async () => {
    const plainObject = {
      firstName: 'Carlos',
    };

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should be valid with optional lastnames', async () => {
    const plainObject = {
      firstName: 'Carlos',
      firstLastname: 'Gómez',
      secondLastname: 'López',
    };

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should be valid when empty object (all optional)', async () => {
    const plainObject = {};

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should accept optional email and phone', async () => {
    const plainObject = {
      email: 'carlos@example.com',
      phone: '+57987654321',
    };

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should accept optional documents field for update', async () => {
    const plainObject = {
      firstName: 'Carlos',
      documents: [
        {
          documentType: 'CC',
          documentNumber: 'NEW12345',
        },
        {
          documentType: 'LICENCIA',
          documentNumber: 'LIC999',
        },
      ],
    };

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should accept optional status field', async () => {
    const plainObject = {
      status: 'ACTIVE',
    };

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation if firstName is too short', async () => {
    const plainObject = {
      firstName: '',
    };

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with invalid email', async () => {
    const plainObject = {
      email: 'not-an-email',
    };

    const dto = plainToClass(UpdateDriverDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
