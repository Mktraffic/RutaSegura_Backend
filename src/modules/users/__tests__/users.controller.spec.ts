import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import {
  validCreateUserDto,
  userInDatabase,
  userInDatabaseList,
  availablePersonsList,
  rolesList,
} from './fixtures/user.fixture';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            inactivate: jest.fn(),
            findRoles: jest.fn(),
            findAvailablePersons: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user and return success response', async () => {
      jest.spyOn(service, 'create').mockResolvedValueOnce(userInDatabase);

      const result = await controller.create(validCreateUserDto);

      expect(result).toEqual({
        success: true,
        message: 'Usuario creado correctamente',
        data: userInDatabase,
      });
      expect(service.create).toHaveBeenCalledWith(validCreateUserDto);
    });
  });

  describe('findAll', () => {
    it('should return all users with success response', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(userInDatabaseList);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        message: 'Listado de usuarios',
        data: userInDatabaseList,
      });
      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered users with query', async () => {
      const query = 'juan';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([userInDatabaseList[0]]);

      const result = await controller.findAll(query);

      expect(result).toEqual({
        success: true,
        message: 'Listado de usuarios',
        data: [userInDatabaseList[0]],
      });
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should trim query parameter', async () => {
      const query = '  juan  ';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce([userInDatabaseList[0]]);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith('juan');
    });

    it('should return undefined when query is empty after trim', async () => {
      const query = '   ';
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(userInDatabaseList);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findRoles', () => {
    it('should return all roles with success response', async () => {
      jest.spyOn(service, 'findRoles').mockResolvedValueOnce(rolesList);

      const result = await controller.findRoles();

      expect(result).toEqual({
        success: true,
        message: 'Listado de roles',
        data: rolesList,
      });
      expect(service.findRoles).toHaveBeenCalled();
    });
  });

  describe('findAvailablePersons', () => {
    it('should return available persons with success response', async () => {
      jest.spyOn(service, 'findAvailablePersons').mockResolvedValueOnce(availablePersonsList);

      const result = await controller.findAvailablePersons();

      expect(result).toEqual({
        success: true,
        message: 'Listado de personas disponibles',
        data: availablePersonsList,
      });
      expect(service.findAvailablePersons).toHaveBeenCalledWith(undefined);
    });

    it('should return filtered available persons with query', async () => {
      const query = 'Pedro';
      jest.spyOn(service, 'findAvailablePersons').mockResolvedValueOnce([availablePersonsList[0]]);

      const result = await controller.findAvailablePersons(query);

      expect(result).toEqual({
        success: true,
        message: 'Listado de personas disponibles',
        data: [availablePersonsList[0]],
      });
      expect(service.findAvailablePersons).toHaveBeenCalledWith(query);
    });

    it('should trim query parameter', async () => {
      const query = '  Pedro  ';
      jest.spyOn(service, 'findAvailablePersons').mockResolvedValueOnce([availablePersonsList[0]]);

      await controller.findAvailablePersons(query);

      expect(service.findAvailablePersons).toHaveBeenCalledWith('Pedro');
    });
  });

  describe('findOne', () => {
    it('should return user by id with success response', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValueOnce(userInDatabase);

      const result = await controller.findOne(1);

      expect(result).toEqual({
        success: true,
        message: 'Detalle del usuario',
        data: userInDatabase,
      });
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update user and return success response', async () => {
      const updateDto = {
        email: 'newemail@example.com',
      };
      const updatedUser = { ...userInDatabase, email: 'newemail@example.com' };
      jest.spyOn(service, 'update').mockResolvedValueOnce(updatedUser);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: updatedUser,
      });
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('inactivate', () => {
    it('should inactivate user and return success response', async () => {
      const inactiveUser = { ...userInDatabase, status: 'INACTIVE' };
      jest.spyOn(service, 'inactivate').mockResolvedValueOnce(inactiveUser);

      const result = await controller.inactivate(1);

      expect(result).toEqual({
        success: true,
        message: 'Usuario inactivado correctamente',
        data: inactiveUser,
      });
      expect(service.inactivate).toHaveBeenCalledWith(1);
    });
  });
});
