import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { validJwtPayloads, invalidJwtPayloads } from './fixtures/jwt.fixture';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Mock de process.env
    process.env.JWT_ACCESS_SECRET = 'test-secret-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('✅ Validación de Tokens Válidos', () => {
    it('T15: Payload válido debe ser validado correctamente', async () => {
      // Arrange
      const payload = validJwtPayloads.coordinator;
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: payload.sub,
        email: payload.email,
        status: 'active',
        role: { name: payload.role },
      });

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      });
    });

    it('T16: Payload debe retornar userId, email y role', async () => {
      // Arrange
      const payload = validJwtPayloads.driver;
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: payload.sub,
        email: payload.email,
        status: 'active',
        role: { name: payload.role },
      });

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('userId', payload.sub);
      expect(result).toHaveProperty('email', payload.email);
      expect(result).toHaveProperty('role', payload.role);
    });

    it('Payload con rol alias "coordinador" debe validarse', async () => {
      // Arrange
      const payload = validJwtPayloads.coordinador;
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: payload.sub,
        email: payload.email,
        status: 'active',
        role: { name: payload.role },
      });

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(payload.sub);
    });

    it('Payload con rol alias "conductor" debe validarse', async () => {
      // Arrange
      const payload = validJwtPayloads.conductor;
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: payload.sub,
        email: payload.email,
        status: 'active',
        role: { name: payload.role },
      });

      // Act
      const result = await strategy.validate(payload);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(payload.sub);
    });
  });

  describe('T17-T21: Rechazo de Tokens Inválidos', () => {
    it('T17: Debe lanzar UnauthorizedException si usuario no existe en BD', async () => {
      // Arrange
      const payload = validJwtPayloads.coordinator;
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('T17b: Debe lanzar UnauthorizedException si rol no existe', async () => {
      // Arrange
      const payload = validJwtPayloads.coordinator;
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: payload.sub,
        email: payload.email,
        status: 'active',
        role: null,
      });

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
    });

    it('T18: Debe lanzar UnauthorizedException si usuario está inactivo', async () => {
      // Arrange
      const payload = validJwtPayloads.coordinator;
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: payload.sub,
        email: payload.email,
        status: 'inactive',
        role: { name: payload.role },
      });

      // Act & Assert
      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User is inactive',
      );
    });
  });
});
