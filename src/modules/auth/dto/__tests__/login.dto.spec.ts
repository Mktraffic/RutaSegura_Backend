import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { LoginDto } from '../login.dto';

describe('LoginDto', () => {
  it('should create a valid LoginDto when all required fields are provided', async () => {
    const plainObject = {
      email: 'user@example.com',
      password: 'securePassword123',
    };

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail validation when email is empty', async () => {
    const plainObject = {
      email: '',
      password: 'securePassword123',
    };

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation when email is not a valid email format', async () => {
    const plainObject = {
      email: 'not-an-email',
      password: 'securePassword123',
    };

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should fail validation when password is empty', async () => {
    const plainObject = {
      email: 'user@example.com',
      password: '',
    };

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation when password is too short', async () => {
    const plainObject = {
      email: 'user@example.com',
      password: 'short',
    };

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
  });

  it('should fail validation when required fields are missing', async () => {
    const plainObject = {};

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation when extra fields are provided but required fields are present', async () => {
    const plainObject = {
      email: 'user@example.com',
      password: 'securePassword123',
      extraField: 'should be ignored',
    };

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    // Extra fields should be ignored, validation should still pass
    expect(errors.length).toBe(0);
  });

  it('should validate email with valid formats', async () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com',
      'user123@test-domain.com',
    ];

    for (const email of validEmails) {
      const plainObject = {
        email,
        password: 'securePassword123',
      };

      const dto = plainToClass(LoginDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    }
  });

  it('should reject email with invalid formats', async () => {
    const invalidEmails = [
      'user@',
      '@example.com',
      'user.example.com',
      'user@.com',
    ];

    for (const email of invalidEmails) {
      const plainObject = {
        email,
        password: 'securePassword123',
      };

      const dto = plainToClass(LoginDto, plainObject);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('should validate password with minimum length', async () => {
    const plainObject = {
      email: 'user@example.com',
      password: 'validPass1',
    };

    const dto = plainToClass(LoginDto, plainObject);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
});
