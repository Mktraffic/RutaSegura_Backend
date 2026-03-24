import * as bcrypt from 'bcrypt';

/**
 * Fixture: usuario válido con rol de coordinador
 */
export const validCoordinatorUser = {
  id: 1,
  email: 'coordinator@test.com',
  password: 'hashedPassword123',
  personId: 1,
  roleId: 1,
  status: 'active',
  pickupEnabled: false,
  createdAt: new Date('2026-03-20'),
};

/**
 * Fixture: usuario válido con rol de conductor
 */
export const validDriverUser = {
  id: 2,
  email: 'driver@test.com',
  password: 'hashedPassword456',
  personId: 2,
  roleId: 2,
  status: 'active',
  pickupEnabled: true,
  createdAt: new Date('2026-03-20'),
};

/**
 * Fixture: usuario inactivo
 */
export const inactiveUser = {
  id: 3,
  email: 'inactive@test.com',
  password: 'hashedPassword789',
  personId: 3,
  roleId: 1,
  status: 'inactive',
  pickupEnabled: false,
  createdAt: new Date('2026-03-20'),
};

/**
 * Fixture: roles disponibles
 */
export const roles = {
  coordinator: {
    id: 1,
    name: 'coordinator',
  },
  coordinador: {
    id: 1,
    name: 'coordinador',
  },
  driver: {
    id: 2,
    name: 'driver',
  },
  conductor: {
    id: 2,
    name: 'conductor',
  },
};

/**
 * Fixture: datos de persona
 */
export const personData = {
  coordinator: {
    id: 1,
    firstName: 'Juan',
    middleName: 'Carlos',
    firstLastname: 'García',
    secondLastname: 'López',
    phone: '1234567890',
  },
  driver: {
    id: 2,
    firstName: 'María',
    middleName: 'José',
    firstLastname: 'Rodríguez',
    secondLastname: 'Martínez',
    phone: '0987654321',
  },
  incomplete: {
    id: 3,
    firstName: 'Pedro',
    middleName: null,
    firstLastname: 'Sanchez',
    secondLastname: null,
    phone: null,
  },
};

/**
 * Usuario encontrado en BD con estructura completa (login)
 */
export const userFoundInDatabase = {
  id: 1,
  email: 'coordinator@test.com',
  password: 'hashedPassword123',
  personId: 1,
  status: 'active',
  role: {
    name: 'coordinator',
  },
  person: {
    firstName: 'Juan',
    middleName: 'Carlos',
    firstLastname: 'García',
    secondLastname: 'López',
  },
};

/**
 * Usuario encontrado en BD para profile
 */
export const userProfileData = {
  id: 1,
  email: 'coordinator@test.com',
  status: 'active',
  role: {
    id: 1,
    name: 'coordinator',
  },
  person: {
    id: 1,
    firstName: 'Juan',
    middleName: 'Carlos',
    firstLastname: 'García',
    secondLastname: 'López',
    phone: '1234567890',
  },
};

/**
 * DTO de login válido
 */
export const validLoginDto = {
  email: 'coordinator@test.com',
  password: 'correctPassword123',
};

/**
 * DTOs de login inválidos
 */
export const invalidLoginDtos = {
  emptyEmail: {
    email: '',
    password: 'password123',
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'password123',
  },
  emptyPassword: {
    email: 'test@test.com',
    password: '',
  },
  bothEmpty: {
    email: '',
    password: '',
  },
};
