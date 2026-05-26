import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  validCoordinatorUser,
  validDriverUser,
  inactiveUser,
  userFoundInDatabase,
  validLoginDto,
} from './fixtures/user.fixture';
import { ttlFormats } from './fixtures/jwt.fixture';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    describe('✅ Casos de Éxito', () => {
      it('T1: Debe hacer login exitoso con credenciales válidas', async () => {
        // Arrange
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          userFoundInDatabase,
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.signAsync as jest.Mock).mockResolvedValue(
          'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImVtYWlsIjoiY29vcmRpbmF0b3JAd GVzdC5jb20iLCJyb2xlIjoiY29vcmRpbmF0b3IifQ.signature',
        );

        // Act
        const result = await service.login(validLoginDto);

        // Assert
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('tokenType', 'Bearer');
        expect(result).toHaveProperty('expiresIn');
        expect(result).toHaveProperty('user');
        expect(result.user.email).toBe('coordinator@test.com');
      });

      it('T2: Token retornado debe tener estructura correcta', async () => {
        // Arrange
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          userFoundInDatabase,
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.signAsync as jest.Mock).mockResolvedValue('token.mock');

        // Act
        const result = await service.login(validLoginDto);

        // Assert
        expect(result).toEqual({
          accessToken: expect.any(String),
          tokenType: 'Bearer',
          expiresIn: expect.any(String),
          expiresInSeconds: expect.any(Number),
          user: expect.any(Object),
        });
      });

      it('T3: Datos del usuario deben incluir id, email, personId, fullName, role, status', async () => {
        // Arrange
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          userFoundInDatabase,
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.signAsync as jest.Mock).mockResolvedValue('token.mock');

        // Act
        const result = await service.login(validLoginDto);

        // Assert
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('email');
        expect(result.user).toHaveProperty('personId');
        expect(result.user).toHaveProperty('fullName');
        expect(result.user).toHaveProperty('role');
        expect(result.user).toHaveProperty('status');
      });

      it('T4: Full name debe construirse correctamente sin espacios extra', async () => {
        // Arrange
        const userWithData = {
          ...userFoundInDatabase,
          person: {
            firstName: 'Juan',
            middleName: 'Carlos',
            firstLastname: 'García',
            secondLastname: 'López',
          },
        };
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          userWithData,
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.signAsync as jest.Mock).mockResolvedValue('token.mock');

        // Act
        const result = await service.login(validLoginDto);

        // Assert
        expect(result.user.fullName).toBe('Juan Carlos García López');
      });

      it('T4b: Full name con datos incompletos', async () => {
        // Arrange
        const userWithData = {
          ...userFoundInDatabase,
          person: {
            firstName: 'Pedro',
            middleName: null,
            firstLastname: 'Sanchez',
            secondLastname: null,
          },
        };
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          userWithData,
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (jwtService.signAsync as jest.Mock).mockResolvedValue('token.mock');

        // Act
        const result = await service.login(validLoginDto);

        // Assert
        expect(result.user.fullName).toBe('Pedro Sanchez');
      });
    });

    describe('❌ Casos de Error', () => {
      it('T5: Debe lanzar UnauthorizedException si usuario no existe', async () => {
        // Arrange
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

        // Act & Assert
        await expect(service.login(validLoginDto)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.login(validLoginDto)).rejects.toThrow(
          'Credenciales invalidas',
        );
      });

      it('T6: Debe lanzar UnauthorizedException si contraseña es incorrecta', async () => {
        // Arrange
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          userFoundInDatabase,
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Act & Assert
        await expect(service.login(validLoginDto)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.login(validLoginDto)).rejects.toThrow(
          'Credenciales invalidas',
        );
      });

      it('T7: Debe lanzar UnauthorizedException si usuario está inactivo', async () => {
        // Arrange
        const inactiveUserData = {
          ...userFoundInDatabase,
          status: 'inactive',
        };
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          inactiveUserData,
        );
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        // Act & Assert
        await expect(service.login(validLoginDto)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(service.login(validLoginDto)).rejects.toThrow(
          'Usuario inactivo',
        );
      });

      it('T7b: Debe lanzar error si usuario no tiene rol', async () => {
        // Arrange
        const userWithoutRole = {
          ...userFoundInDatabase,
          role: null,
        };
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          userWithoutRole,
        );

        // Act & Assert
        await expect(service.login(validLoginDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });
  });

  describe('getProfile', () => {
    describe('✅ Casos de Éxito', () => {
      it('T22: Debe obtener perfil de usuario existente', async () => {
        // Arrange
        const userId = 1;
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
          id: userId,
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
        });

        // Act
        const result = await service.getProfile(userId);

        // Assert
        expect(result).toHaveProperty('id', userId);
        expect(result).toHaveProperty('email');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('role');
        expect(result).toHaveProperty('person');
      });

      it('T23: Estructura del perfil debe incluir role y person', async () => {
        // Arrange
        const userId = 1;
        const expectedProfile = {
          id: userId,
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
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
          expectedProfile,
        );

        // Act
        const result = await service.getProfile(userId);

        // Assert
        expect(result).toEqual(expectedProfile);
      });

      it('T24: Datos personales deben incluir firstName, middleName, lastnames, phone', async () => {
        // Arrange
        const userId = 1;
        (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
          id: userId,
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
        });

        // Act
        const result = await service.getProfile(userId);

        // Assert
        expect(result.person).toHaveProperty('firstName');
        expect(result.person).toHaveProperty('middleName');
        expect(result.person).toHaveProperty('firstLastname');
        expect(result.person).toHaveProperty('secondLastname');
        expect(result.person).toHaveProperty('phone');
      });
    });

    describe('❌ Casos de Error', () => {
      it('T25: Debe lanzar error si usuario no existe', async () => {
        // Arrange
        const userId = 999;
        (prismaService.user.findUniqueOrThrow as jest.Mock).mockRejectedValue(
          new Error('Not found'),
        );

        // Act & Assert
        await expect(service.getProfile(userId)).rejects.toThrow();
      });
    });
  });

  describe('parseTtlToSeconds', () => {
    describe('✅ Parsing de TTL', () => {
      ttlFormats.forEach(({ input, expected }) => {
        it(`Debe parsear "${input}" a ${expected} segundos`, () => {
          // Act
          const result = (service as any).parseTtlToSeconds(input);

          // Assert
          expect(result).toBe(expected);
        });
      });
    });

    describe('❌ TTL Inválidos', () => {
      it('T48: Debe retornar valor por defecto para TTL inválido', () => {
        // Act
        const result = (service as any).parseTtlToSeconds('invalid');

        // Assert
        expect(result).toBe(3600); // default 1 hour
      });
    });
  });
});
