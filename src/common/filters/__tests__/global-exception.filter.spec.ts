import { ArgumentsHost, BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from '../global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test-path',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ArgumentsHost;
  });

  describe('catch method', () => {
    it('should handle HttpException', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe('Test error');
      expect(payload.statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should handle generic exception', () => {
      const exception = new Error('Internal error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include timestamp in error response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.timestamp).toBeDefined();
      expect(typeof payload.timestamp).toBe('string');
    });

    it('should include path in error response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.path).toBe('/test-path');
    });

    it('should handle request without url', () => {
      mockRequest.url = undefined;

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.path).toBe('');
    });
  });

  describe('HttpException handling', () => {
    it('should normalize string error message', () => {
      const exception = new HttpException('String error message', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('String error message');
      expect(payload.errors).toBeUndefined();
    });

    it('should normalize object error message', () => {
      const exception = new HttpException(
        { message: 'Object error' },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('Object error');
    });

    it('should handle array of error messages', () => {
      const exception = new HttpException(
        { message: ['Error 1', 'Error 2', 'Error 3'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('Revisa la informacion ingresada');
      expect(payload.errors).toEqual(['Error 1', 'Error 2', 'Error 3']);
    });

    it('should handle errors field in exception', () => {
      const exception = new HttpException(
        { message: 'Error', errors: ['Field error'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.errors).toEqual(['Field error']);
    });

    it('should handle error field fallback', () => {
      const exception = new HttpException(
        { error: 'Fallback error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('Fallback error');
    });
  });

  describe('Prisma error handling', () => {
    it('should handle Prisma P2002 unique constraint error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('No pudimos guardar la informacion');
      expect(payload.errors).toContain('Ya existe un registro con ese email');
    });

    it('should handle Prisma P2003 foreign key error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { target: ['userId'] },
        },
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('No pudimos completar esta accion');
      expect(payload.errors).toContain('El valor de userId no existe o no es valido');
    });

    it('should handle Prisma P2025 record not found error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
          meta: { target: [] },
        },
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('No encontramos la informacion que buscas');
    });

    it('should handle Prisma P2000 value too long error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Value too long',
        {
          code: 'P2000',
          clientVersion: '5.0.0',
          meta: { target: ['name'] },
        },
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('No pudimos guardar la informacion');
      expect(payload.errors).toContain('El valor para name es demasiado largo');
    });

    it('should handle unknown Prisma error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P9999',
          clientVersion: '5.0.0',
          meta: {},
        },
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('No pudimos completar esta accion');
    });

    it('should handle Prisma validation error', () => {
      const error = new Prisma.PrismaClientValidationError(
        'Invalid data',
        {
          clientVersion: '5.0.0',
        },
      );

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe('Revisa la informacion ingresada');
    });
  });

  describe('Error target extraction', () => {
    it('should extract single target from array', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(error, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.errors[0]).toContain('email');
    });

    it('should extract multiple targets from array', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['firstName', 'lastName'] },
        },
      );

      filter.catch(error, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.errors[0]).toContain('firstName');
    });

    it('should handle missing target', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {},
        },
      );

      filter.catch(error, mockArgumentsHost);

      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.errors).toContain('Ya existe un registro con esos mismos datos');
    });
  });

  describe('Unknown exception handling', () => {
    it('should handle null exception', () => {
      filter.catch(null, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.message).toBe(
        'Tuvimos un problema interno. Intenta nuevamente en unos minutos',
      );
    });

    it('should handle undefined exception', () => {
      filter.catch(undefined, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const payload = mockResponse.json.mock.calls[0][0];
      expect(payload.success).toBe(false);
    });
  });
});
