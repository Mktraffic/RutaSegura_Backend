import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../roles.guard';
import { ROLES_KEY } from '../../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(async () => {
    mockRequest = {
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should return true if no roles are required', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true if no roles array is provided', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true if user has required role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not have required role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['superadmin']);
      mockRequest.user.role = 'admin';

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('No tienes permisos para realizar esta accion');
    });

    it('should handle case-insensitive role comparison', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
      mockRequest.user.role = 'admin';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true if user has one of multiple required roles', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'admin',
        'moderator',
        'user',
      ]);
      mockRequest.user.role = 'moderator';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw if user role does not match any required role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'admin',
        'moderator',
      ]);
      mockRequest.user.role = 'guest';

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should check ROLES_KEY metadata', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should handle missing user in request', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      mockRequest.user = undefined;

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should handle missing role in user object', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      mockRequest.user = { id: '1', email: 'test@example.com' };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should handle null or undefined role', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      mockRequest.user.role = null;

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should convert empty role to empty string and compare', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['']);
      mockRequest.user.role = null;

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('role comparison', () => {
    it('should do case-insensitive matching', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'ADMIN',
        'USER',
      ]);
      mockRequest.user.role = 'admin';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle mixed case roles', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        'Admin',
        'User',
      ]);
      mockRequest.user.role = 'ADMIN';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle spaces in role names', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['super admin']);
      mockRequest.user.role = 'super admin';

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should provide descriptive error message', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      mockRequest.user.role = 'user';

      try {
        guard.canActivate(mockExecutionContext);
      } catch (error: any) {
        expect(error.message).toBe('No tienes permisos para realizar esta accion');
      }
    });

    it('should throw ForbiddenException type', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['admin']);
      mockRequest.user.role = 'user';

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });
  });
});
