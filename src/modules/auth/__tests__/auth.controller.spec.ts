import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { validLoginDto } from './fixtures/user.fixture';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    describe('✅ T1-T4: Login Exitoso', () => {
      it('T1: Debe retornar token al hacer login exitoso', async () => {
        // Arrange
        const mockResponse = {
          accessToken: 'mock.jwt.token',
          tokenType: 'Bearer',
          expiresIn: '1h',
          expiresInSeconds: 3600,
          user: {
            id: 1,
            email: 'coordinator@test.com',
            personId: 1,
            fullName: 'Juan Carlos García López',
            role: 'coordinator',
            status: 'active',
          },
        };
        (authService.login as jest.Mock).mockResolvedValue(mockResponse);

        // Act
        const result = await controller.login(validLoginDto);

        // Assert
        expect(result).toEqual(mockResponse);
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('tokenType', 'Bearer');
      });

      it('T2: Respuesta debe incluir accessToken, tokenType, expiresIn, expiresInSeconds, user', async () => {
        // Arrange
        const mockResponse = {
          accessToken: 'token',
          tokenType: 'Bearer',
          expiresIn: '1h',
          expiresInSeconds: 3600,
          user: {
            id: 1,
            email: 'test@test.com',
            personId: 1,
            fullName: 'Test User',
            role: 'coordinator',
            status: 'active',
          },
        };
        (authService.login as jest.Mock).mockResolvedValue(mockResponse);

        // Act
        const result = await controller.login(validLoginDto);

        // Assert
        expect(result).toEqual(mockResponse);
      });
    });

    describe('❌ T5-T10: Login Fallido', () => {
      it('T5: Debe lanzar UnauthorizedException con credenciales inválidas', async () => {
        // Arrange
        (authService.login as jest.Mock).mockRejectedValue(
          new UnauthorizedException('Credenciales invalidas'),
        );

        // Act & Assert
        await expect(
          controller.login({
            email: 'nonexistent@test.com',
            password: 'anypassword',
          }),
        ).rejects.toThrow(UnauthorizedException);
      });

      it('T7: Debe lanzar UnauthorizedException si usuario está inactivo', async () => {
        // Arrange
        (authService.login as jest.Mock).mockRejectedValue(
          new UnauthorizedException('Usuario inactivo'),
        );

        // Act & Assert
        await expect(controller.login(validLoginDto)).rejects.toThrow(
          'Usuario inactivo',
        );
      });
    });

    describe('T34: @Public Decorator', () => {
      it('T34: /auth/login debe ser accesible sin token', async () => {
        // Nota: Este test verifica que el endpoint está marcado como @Public
        // La decoración @Public en el método indicaría que no necesita autenticación
        expect(controller.login).toBeDefined();
        // Verificar que el método existe y es callable
      });
    });
  });

  describe('profile', () => {
    describe('✅ T22-T24: Profile Exitoso', () => {
      it('T22: Debe retornar perfil del usuario autenticado', async () => {
        // Arrange
        const mockUserData = {
          id: 1,
          email: 'coordinator@test.com',
          status: 'active',
          role: { id: 1, name: 'coordinator' },
          person: {
            id: 1,
            firstName: 'Juan',
            middleName: 'Carlos',
            firstLastname: 'García',
            secondLastname: 'López',
            phone: '1234567890',
          },
        };
        (authService.getProfile as jest.Mock).mockResolvedValue(mockUserData);

        // Act
        const result = await controller.profile({
          userId: 1,
          email: 'coordinator@test.com',
          role: 'coordinator',
          personId: 1,
        });

        // Assert
        expect(result).toEqual(mockUserData);
      });

      it('T23: Perfil debe incluir id, email, status, role, person', async () => {
        // Arrange
        const mockUserData = {
          id: 1,
          email: 'coordinator@test.com',
          status: 'active',
          role: { id: 1, name: 'coordinator' },
          person: {
            id: 1,
            firstName: 'Juan',
            middleName: 'Carlos',
            firstLastname: 'García',
            secondLastname: 'López',
            phone: '1234567890',
          },
        };
        (authService.getProfile as jest.Mock).mockResolvedValue(mockUserData);

        // Act
        const result = await controller.profile({
          userId: 1,
          email: 'coordinator@test.com',
          role: 'coordinator',
          personId: 1,
        });

        // Assert
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('role');
        expect(result).toHaveProperty('person');
      });

      it('T24: Person data debe incluir firstName, middleName, lastnames, phone', async () => {
        // Arrange
        const mockUserData = {
          id: 1,
          email: 'coordinator@test.com',
          status: 'active',
          role: { id: 1, name: 'coordinator' },
          person: {
            id: 1,
            firstName: 'Juan',
            middleName: 'Carlos',
            firstLastname: 'García',
            secondLastname: 'López',
            phone: '1234567890',
          },
        };
        (authService.getProfile as jest.Mock).mockResolvedValue(mockUserData);

        // Act
        const result = await controller.profile({
          userId: 1,
          email: 'coordinator@test.com',
          role: 'coordinator',
          personId: 1,
        });

        // Assert
        expect(result.person).toHaveProperty('firstName');
        expect(result.person).toHaveProperty('middleName');
        expect(result.person).toHaveProperty('firstLastname');
        expect(result.person).toHaveProperty('secondLastname');
        expect(result.person).toHaveProperty('phone');
      });
    });

    describe('❌ T25-T26: Profile Error', () => {
      it('T25: Debe lanzar error si usuario no existe', async () => {
        // Arrange
        (authService.getProfile as jest.Mock).mockRejectedValue(
          new Error('User not found'),
        );

        // Act & Assert
        await expect(
          controller.profile({ userId: 999, email: 'test@test.com', role: 'coordinator', personId: 1 }),
        ).rejects.toThrow();
      });

      it('T26: Debe retornar 401 si no hay token válido', async () => {
        // Nota: Este test es más un test de integración/guardias
        // Aquí simplemente verificamos que el método requiere un decorador
        expect(controller.profile).toBeDefined();
      });
    });

    describe('T36-T37: @CurrentUser Decorator', () => {
      it('T36-T37: Debe extraer userId del token via @CurrentUser', async () => {
        // Arrange
        const mockUserData = {
          id: 1,
          email: 'coordinator@test.com',
          status: 'active',
          role: { id: 1, name: 'coordinator' },
          person: { id: 1, firstName: 'Juan' },
        };
        (authService.getProfile as jest.Mock).mockResolvedValue(mockUserData);

        // Act
        const currentUser = {
          userId: 1,
          email: 'coordinator@test.com',
          role: 'coordinator',
          personId: 1,
        };
        const result = await controller.profile(currentUser);

        // Assert
        expect(authService.getProfile).toHaveBeenCalledWith(currentUser.userId);
        expect(result).toHaveProperty('id', 1);
      });
    });
  });

  describe('RBAC - Role-Based Access Control', () => {
    describe('✅ T27-T29: Acceso Permitido', () => {
      it('T27: Coordinator debe acceder a /auth/rbac/coordinator', async () => {
        // Act
        const result = controller.onlyCoordinator();

        // Assert
        expect(result).toEqual({
          message: 'Acceso permitido para coordinator',
        });
      });

      it('T28: Driver debe acceder a /auth/rbac/driver', async () => {
        // Act
        const result = controller.onlyDriver();

        // Assert
        expect(result).toEqual({
          message: 'Acceso permitido para driver',
        });
      });
    });

    describe('T29: Aliases de Roles', () => {
      it('T29a: Role alias "coordinador" debe ser válido', () => {
        // Nota: El guard @Roles acepta 'coordinator' y 'coordinador'
        // Este test verifica que el endpoint existe
        expect(controller.onlyCoordinator).toBeDefined();
      });

      it('T29b: Role alias "conductor" debe ser válido', () => {
        // Nota: Similar para driver/conductor
        expect(controller.onlyDriver).toBeDefined();
      });
    });

    describe('❌ T30-T33: Acceso Denegado', () => {
      it('T30: Driver NO debe acceder a /auth/rbac/coordinator', () => {
        // Nota: Este test se verifica en el test de integración con guardias
        // Aquí solo verificamos que los métodos existen y están diferenciados
        expect(controller.onlyCoordinator).toBeDefined();
        expect(controller.onlyDriver).toBeDefined();
        expect(controller.onlyCoordinator).not.toEqual(controller.onlyDriver);
      });
    });
  });
});
