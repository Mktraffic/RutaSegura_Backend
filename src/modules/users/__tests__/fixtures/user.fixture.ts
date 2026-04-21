export const validCreateUserDto = {
  email: 'juan.perez@example.com',
  password: 'SecurePassword123!',
  personId: 1,
  roleId: 2,
  pickupEnabled: true,
};

export const validCreateUserDtoWithoutPickup = {
  email: 'maria.lopez@example.com',
  password: 'SecurePassword456!',
  personId: 2,
  roleId: 3,
};

export const userInDatabase = {
  id: 1,
  email: 'juan.perez@example.com',
  status: 'ACTIVE',
  pickupEnabled: true,
  createdAt: new Date('2025-01-01'),
  role: {
    id: 2,
    name: 'driver',
  },
  person: {
    id: 1,
    personType: 'DRIVER',
    firstName: 'Juan',
    middleName: 'Carlos',
    firstLastname: 'Pérez',
    secondLastname: 'García',
    email: 'juan.perez@example.com',
    status: 'ACTIVE',
  },
};

export const userInDatabaseList = [
  {
    id: 1,
    email: 'juan.perez@example.com',
    status: 'ACTIVE',
    pickupEnabled: false,
    createdAt: new Date('2025-01-01'),
    role: {
      id: 2,
      name: 'driver',
    },
    person: {
      id: 1,
      personType: 'DRIVER',
      firstName: 'Juan',
      middleName: 'Carlos',
      firstLastname: 'Pérez',
      secondLastname: 'García',
      email: 'juan.perez@example.com',
      status: 'ACTIVE',
    },
  },
  {
    id: 2,
    email: 'maria.lopez@example.com',
    status: 'ACTIVE',
    pickupEnabled: false,
    createdAt: new Date('2025-01-02'),
    role: {
      id: 3,
      name: 'coordinator',
    },
    person: {
      id: 2,
      personType: 'COORDINATOR',
      firstName: 'María',
      middleName: null,
      firstLastname: 'López',
      secondLastname: 'García',
      email: 'maria.lopez@example.com',
      status: 'ACTIVE',
    },
  },
] as any[];

export const availablePersonsList = [
  {
    id: 1,
    personType: 'DRIVER',
    firstName: 'Pedro',
    middleName: 'Luis',
    firstLastname: 'Rodríguez',
    secondLastname: 'Martínez',
    email: 'pedro.rodriguez@example.com',
    status: 'ACTIVE',
  },
  {
    id: 2,
    personType: 'COORDINATOR',
    firstName: 'Ana',
    middleName: null,
    firstLastname: 'Gómez',
    secondLastname: null,
    email: 'ana.gomez@example.com',
    status: 'ACTIVE',
  },
] as any[];

export const rolesList = [
  {
    id: 1,
    name: 'admin',
  },
  {
    id: 2,
    name: 'driver',
  },
  {
    id: 3,
    name: 'coordinator',
  },
] as any[];

export const duplicateEmailError = {
  success: false,
  message: 'No se pudo crear el usuario',
  errors: ['Ya existe un usuario con ese email'],
};

export const userNotFoundError = {
  success: false,
  message: 'Usuario no encontrado',
};

export const userAlreadyInactiveError = {
  success: false,
  message: 'No se pudo inactivar el usuario',
  errors: ['El usuario ya se encuentra inactivo'],
};
