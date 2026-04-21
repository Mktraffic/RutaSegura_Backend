import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  validCreateUserDto,
  validCreateUserDtoWithoutPickup,
  userInDatabase,
  userInDatabaseList,
  availablePersonsList,
  rolesList,
  duplicateEmailError,
  userNotFoundError,
  userAlreadyInactiveError,
} from './fixtures/user.fixture';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            person: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            role: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findRoles', () => {
    it('should return all roles ordered by name', async () => {
      jest.spyOn(prismaService.role, 'findMany').mockResolvedValueOnce(rolesList);

      const result = await service.findRoles();

      expect(result).toEqual(rolesList);
      expect(prismaService.role.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      });
    });

    it('should return empty array when no roles exist', async () => {
      jest.spyOn(prismaService.role, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findRoles();

      expect(result).toEqual([]);
    });
  });

  describe('findAvailablePersons', () => {
    it('should return available persons without query', async () => {
      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce(availablePersonsList);

      const result = await service.findAvailablePersons();

      expect(result).toEqual(availablePersonsList);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            users: { none: {} },
            status: 'ACTIVE',
            personType: { in: ['DRIVER', 'COORDINATOR'] },
          },
        }),
      );
    });

    it('should return filtered available persons with query', async () => {
      const query = 'Juan';
      jest.spyOn(prismaService.person, 'findMany').mockResolvedValueOnce([availablePersonsList[0]]);

      const result = await service.findAvailablePersons(query);

      expect(result).toEqual([availablePersonsList[0]]);
      expect(prismaService.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            users: { none: {} },
            status: 'ACTIVE',
            personType: { in: ['DRIVER', 'COORDINATOR'] },
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a user successfully with pickup enabled', async () => {
      const hashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce({
        id: 1,
        personType: 'DRIVER',
        status: 'ACTIVE',
      } as any);
      jest.spyOn(prismaService.role, 'findUnique').mockResolvedValueOnce({
        id: 2,
        name: 'driver',
      } as any);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.role, 'findUniqueOrThrow').mockResolvedValueOnce({
        name: 'driver',
      } as any);
      jest.spyOn(prismaService.user, 'create').mockResolvedValueOnce(userInDatabase as any);

      const result = await service.create(validCreateUserDto);

      expect(result).toEqual(userInDatabase);
      expect(bcrypt.hash).toHaveBeenCalledWith(validCreateUserDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should create a user without pickup enabled', async () => {
      const hashedPassword = 'hashedPassword456';
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce({
        id: 2,
        personType: 'COORDINATOR',
        status: 'ACTIVE',
      } as any);
      jest.spyOn(prismaService.role, 'findUnique').mockResolvedValueOnce({
        id: 3,
        name: 'coordinator',
      } as any);
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.role, 'findUniqueOrThrow').mockResolvedValueOnce({
        name: 'coordinator',
      } as any);
      jest.spyOn(prismaService.user, 'create').mockResolvedValueOnce({
        ...userInDatabase,
        pickupEnabled: false,
      } as any);

      const result = await service.create(validCreateUserDtoWithoutPickup);

      expect(result.pickupEnabled).toBe(false);
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when email already exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce({
        id: 99,
      } as any);

      await expect(service.create(validCreateUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when person does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.create(validCreateUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when role does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.person, 'findUnique').mockResolvedValueOnce({
        id: 1,
        personType: 'DRIVER',
        status: 'ACTIVE',
      } as any);
      jest.spyOn(prismaService.role, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.create(validCreateUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all users when no query is provided', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValueOnce(userInDatabaseList);

      const result = await service.findAll();

      expect(result).toEqual(userInDatabaseList);
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
          orderBy: { id: 'desc' },
        }),
      );
    });

    it('should return filtered users with query', async () => {
      const query = 'juan';
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValueOnce([userInDatabaseList[0]]);

      const result = await service.findAll(query);

      expect(result).toEqual([userInDatabaseList[0]]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
          orderBy: { id: 'desc' },
        }),
      );
    });

    it('should return empty array when no users match query', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValueOnce([]);

      const result = await service.findAll('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(userInDatabase as any);

      const result = await service.findOne(1);

      expect(result).toEqual(userInDatabase);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('inactivate', () => {
    it('should inactivate active user', async () => {
      const activeUser = { ...userInDatabase, status: 'ACTIVE' };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(activeUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValueOnce({
        ...userInDatabase,
        status: 'INACTIVE',
      } as any);

      const result = await service.inactivate(1);

      expect(result.status).toBe('INACTIVE');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'INACTIVE' },
        select: expect.any(Object),
      });
    });

    it('should throw BadRequestException when user is already inactive', async () => {
      const inactiveUser = { ...userInDatabase, status: 'INACTIVE' };
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(inactiveUser as any);

      await expect(service.inactivate(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.inactivate(999)).rejects.toThrow(NotFoundException);
    });
  });
});
