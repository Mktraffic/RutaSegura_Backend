import { BadRequestException, ValidationError } from '@nestjs/common';
import { buildValidationException } from '../validation-exception.factory';

describe('buildValidationException', () => {
  describe('basic validation errors', () => {
    it('should handle isNotEmpty constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isNotEmpty: 'email should not be empty',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      expect(exception).toBeInstanceOf(BadRequestException);
      const response = exception.getResponse() as any;
      expect(response.success).toBe(false);
      expect(response.errors).toContain('email es obligatorio');
    });

    it('should handle isString constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'name',
          constraints: {
            isString: 'name must be a string',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('name debe ser un texto');
    });

    it('should handle isEmail constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('email debe tener un correo valido');
    });

    it('should handle isInt constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'age',
          constraints: {
            isInt: 'age must be an integer',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('age debe ser un numero entero');
    });

    it('should handle isDateString constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'birthDate',
          constraints: {
            isDateString: 'birthDate must be a date string',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain(
        'birthDate debe tener formato de fecha valido (YYYY-MM-DD)',
      );
    });
  });

  describe('min and max constraints', () => {
    it('should handle min constraint with number', () => {
      const errors: ValidationError[] = [
        {
          property: 'age',
          constraints: {
            min: 'age must not be less than 18',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('age debe ser mayor o igual a 18');
    });

    it('should handle max constraint with number', () => {
      const errors: ValidationError[] = [
        {
          property: 'age',
          constraints: {
            max: 'age must not be greater than 100',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('age debe ser menor o igual a 100');
    });

    it('should handle min with decimal number', () => {
      const errors: ValidationError[] = [
        {
          property: 'price',
          constraints: {
            min: 'price must not be less than 0.5',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('price debe ser mayor o igual a 0.5');
    });
  });

  describe('length constraints', () => {
    it('should handle minLength constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'password',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('password debe tener al menos 8 caracteres');
    });

    it('should handle maxLength constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'username',
          constraints: {
            maxLength: 'username must be shorter than or equal to 20 characters',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('username no puede superar 20 caracteres');
    });
  });

  describe('whitelistValidation', () => {
    it('should handle whitelistValidation constraint', () => {
      const errors: ValidationError[] = [
        {
          property: 'invalidField',
          constraints: {
            whitelistValidation: 'property invalidField should not exist',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('invalidField no es un campo permitido');
    });
  });

  describe('multiple errors', () => {
    it('should handle multiple validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as ValidationError,
        {
          property: 'password',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors.length).toBe(2);
      expect(response.errors).toContain('email debe tener un correo valido');
      expect(response.errors).toContain('password debe tener al menos 8 caracteres');
    });

    it('should handle multiple constraints on same field', () => {
      const errors: ValidationError[] = [
        {
          property: 'password',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
            isString: 'password must be a string',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors.length).toBe(2);
      expect(response.errors).toContain('password debe tener al menos 8 caracteres');
      expect(response.errors).toContain('password debe ser un texto');
    });
  });

  describe('nested validation errors', () => {
    it('should handle nested validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'address',
          children: [
            {
              property: 'street',
              constraints: {
                isNotEmpty: 'street should not be empty',
              },
            } as ValidationError,
          ],
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('address.street es obligatorio');
    });

    it('should handle deeply nested validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'company',
          children: [
            {
              property: 'address',
              children: [
                {
                  property: 'country',
                  constraints: {
                    isNotEmpty: 'country should not be empty',
                  },
                } as ValidationError,
              ],
            } as ValidationError,
          ],
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('company.address.country es obligatorio');
    });

    it('should handle multiple nested errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'address',
          children: [
            {
              property: 'street',
              constraints: {
                isNotEmpty: 'street should not be empty',
              },
            } as ValidationError,
            {
              property: 'city',
              constraints: {
                isNotEmpty: 'city should not be empty',
              },
            } as ValidationError,
          ],
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors.length).toBe(2);
      expect(response.errors).toContain('address.street es obligatorio');
      expect(response.errors).toContain('address.city es obligatorio');
    });
  });

  describe('empty errors', () => {
    it('should handle empty errors array', () => {
      const errors: ValidationError[] = [];

      const exception = buildValidationException(errors);

      expect(exception).toBeInstanceOf(BadRequestException);
      const response = exception.getResponse() as any;
      expect(response.errors).toEqual([
        'Hay campos con valores no validos',
      ]);
    });

    it('should handle errors with no constraints', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
          constraints: {},
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toEqual([
        'Hay campos con valores no validos',
      ]);
    });

    it('should handle errors with no constraints and no children', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toEqual([
        'Hay campos con valores no validos',
      ]);
    });
  });

  describe('duplicate handling', () => {
    it('should remove duplicate error messages', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as ValidationError,
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      // Should have one unique error instead of two duplicates
      // The factory uses [...new Set(messages)] to remove duplicates
      expect(response.errors.length).toBe(1);
      expect(response.errors[0]).toBe('email debe tener un correo valido');
    });

    it('should preserve duplicate count when messages are different', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as ValidationError,
        {
          property: 'password',
          constraints: {
            minLength: 'password must be longer than or equal to 8 characters',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors.length).toBe(2);
    });
  });

  describe('response structure', () => {
    it('should return BadRequestException', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
          constraints: {
            isNotEmpty: 'field is required',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      expect(exception).toBeInstanceOf(BadRequestException);
    });

    it('should have correct response structure', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.success).toBe(false);
      expect(response.message).toBe('Revisa los datos ingresados');
      expect(Array.isArray(response.errors)).toBe(true);
    });

    it('should have correct HTTP status', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
          constraints: {
            isNotEmpty: 'field is required',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('unknown constraints', () => {
    it('should handle unknown constraint with default message', () => {
      const errors: ValidationError[] = [
        {
          property: 'field',
          constraints: {
            unknownRule: 'unknown validation rule',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('field tiene un valor no valido');
    });
  });

  describe('edge cases', () => {
    it('should handle field names with special characters', () => {
      const errors: ValidationError[] = [
        {
          property: 'user-email_123',
          constraints: {
            isEmail: 'email must be an email',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors).toContain('user-email_123 debe tener un correo valido');
    });

    it('should use field name when provided', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isNotEmpty: 'email should not be empty',
          },
        } as ValidationError,
      ];

      const exception = buildValidationException(errors);

      const response = exception.getResponse() as any;
      expect(response.errors[0]).toMatch(/^email/);
    });
  });
});
