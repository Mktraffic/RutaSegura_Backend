import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateUserDto, UpdateUserDto } from '../user.dto';

describe('CreateUserDto', () => {
  it('should create a valid CreateUserDto with all required fields', async () => {
    const plainObject = {
      personId: 1,
      email: 'user@example.com',
      password: 'securePassword123',
      roleId: 1,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should allow omitting personId (guardian flow uses guardianId; the service enforces it)', async () => {
    const plainObject = {
      email: 'user@example.com',
      password: 'securePassword123',
      roleId: 1,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    // personId es opcional a nivel DTO: para acudientes se envía guardianId.
    expect(errors.some((e) => e.property === 'personId')).toBe(false);
  });

  it('should accept a guardianId instead of personId', async () => {
    const plainObject = {
      email: 'guardian@example.com',
      password: 'securePassword123',
      roleId: 4,
      guardianId: 2,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation when email is invalid', async () => {
    const plainObject = {
      personId: 1,
      email: 'invalid-email',
      password: 'securePassword123',
      roleId: 1,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail validation when password is too short', async () => {
    const plainObject = {
      personId: 1,
      email: 'user@example.com',
      password: 'short',
      roleId: 1,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should fail validation when roleId is missing', async () => {
    const plainObject = {
      personId: 1,
      email: 'user@example.com',
      password: 'securePassword123',
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept with roleId and optional pickupEnabled', async () => {
    const plainObject = {
      personId: 1,
      email: 'user@example.com',
      password: 'securePassword123',
      roleId: 1,
      pickupEnabled: true,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation with roleId less than 1', async () => {
    const plainObject = {
      personId: 1,
      email: 'user@example.com',
      password: 'securePassword123',
      roleId: 0,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with non-numeric personId', async () => {
    const plainObject = {
      personId: 'not-a-number',
      email: 'user@example.com',
      password: 'securePassword123',
      roleId: 1,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate email length constraints', async () => {
    const plainObject = {
      personId: 1,
      email: 'a'.repeat(101) + '@example.com',
      password: 'securePassword123',
      roleId: 1,
    };

    const dto = plainToClass(CreateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});

describe('UpdateUserDto', () => {
  it('should create a valid UpdateUserDto with only email', async () => {
    const plainObject = {
      email: 'newemail@example.com',
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should create a valid UpdateUserDto with only password', async () => {
    const plainObject = {
      password: 'newPassword123',
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should create a valid UpdateUserDto with email and password', async () => {
    const plainObject = {
      email: 'newemail@example.com',
      password: 'newPassword123',
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation when email is invalid format', async () => {
    const plainObject = {
      email: 'invalid-email',
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail validation when password is too short', async () => {
    const plainObject = {
      password: 'short',
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('should accept optional roleId field', async () => {
    const plainObject = {
      roleId: 2,
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should accept optional pickupEnabled field', async () => {
    const plainObject = {
      pickupEnabled: false,
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should be valid when all fields are provided', async () => {
    const plainObject = {
      email: 'newemail@example.com',
      password: 'newPassword123',
      roleId: 2,
      pickupEnabled: true,
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should be valid when empty object is provided (all fields optional)', async () => {
    const plainObject = {};

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should validate roleId minimum value', async () => {
    const plainObject = {
      roleId: 0,
    };

    const dto = plainToClass(UpdateUserDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
