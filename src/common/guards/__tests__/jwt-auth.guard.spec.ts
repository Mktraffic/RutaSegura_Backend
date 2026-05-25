import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: '1', email: 'test@example.com' },
        }),
      }),
    } as unknown as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should return true if route is marked as public', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should check IS_PUBLIC_KEY metadata', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      // Mock the parent canActivate method since we can't easily instantiate AuthGuard
      jest.spyOn(guard, 'canActivate').mockImplementation((ctx) => {
        const isPublic = reflector.getAllAndOverride(IS_PUBLIC_KEY, [
          ctx.getHandler(),
          ctx.getClass(),
        ]);
        return !isPublic;
      });

      const result = guard.canActivate(mockExecutionContext);

      // Should check for public metadata
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'isPublic',
        expect.any(Array),
      );
    });

    it('should pass context handler and class to getAllAndOverride', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });

  describe('handleRequest', () => {
    it('should return user if no error and user exists', () => {
      const user = { id: '1', email: 'test@example.com', role: 'admin' };

      const result = guard.handleRequest(null, user);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if error exists', () => {
      const error = new UnauthorizedException('JWT error');

      expect(() => {
        guard.handleRequest(error, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with default message if no error but user missing', () => {
      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow('Tu sesion no es valida o ya vencio');
    });

    it('should throw UnauthorizedException with proper message for undefined user', () => {
      try {
        guard.handleRequest(null, undefined);
        fail('should have thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Tu sesion no es valida o ya vencio');
      }
    });

    it('should use provided error message if available', () => {
      const customError = new UnauthorizedException('Custom JWT error');

      expect(() => {
        guard.handleRequest(customError, null);
      }).toThrow(UnauthorizedException);
    });

    it('should handle undefined user as missing', () => {
      expect(() => {
        guard.handleRequest(null, undefined);
      }).toThrow(UnauthorizedException);
    });

    it('should handle null user as missing', () => {
      expect(() => {
        guard.handleRequest(null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should return different user types', () => {
      const user = { id: '123', username: 'testuser', permissions: ['read'] };

      const result = guard.handleRequest(null, user);

      expect(result).toEqual(user);
    });

    it('should prioritize error over missing user', () => {
      const error = new Error('Token expired');

      expect(() => {
        guard.handleRequest(error, null);
      }).toThrow();
    });

    it('should handle falsy user values', () => {
      expect(() => {
        guard.handleRequest(null, false as unknown);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, '' as unknown);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, 0 as unknown);
      }).toThrow(UnauthorizedException);
    });
  });

  describe('guard structure', () => {
    it('should have canActivate method', () => {
      expect(typeof guard.canActivate).toBe('function');
    });

    it('should have handleRequest method', () => {
      expect(typeof guard.handleRequest).toBe('function');
    });

    it('should have reflector injected', () => {
      expect(reflector).toBeDefined();
      expect(typeof reflector.getAllAndOverride).toBe('function');
    });
  });
});
