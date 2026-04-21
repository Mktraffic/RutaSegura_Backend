export const validDriverDocument = {
  documentType: 'CC',
  documentNumber: '1234567890',
  description: 'Cédula de ciudadanía',
  documentRole: 'DRIVER_ID',
};

export const validCreateDriverDto = {
  firstName: 'Juan',
  middleName: 'Carlos',
  firstLastname: 'Pérez',
  secondLastname: 'García',
  phone: '3001234567',
  email: 'juan.perez@example.com',
  document: validDriverDocument,
};

export const validCreateDriverDtoWithoutOptionals = {
  firstName: 'María',
  firstLastname: 'López',
  email: 'maria.lopez@example.com',
  phone: '3009876543',
  document: {
    documentType: 'CC',
    documentNumber: '9876543210',
  },
};

export const driverInDatabase = {
  id: 1,
  personType: 'DRIVER',
  firstName: 'Juan',
  middleName: 'Carlos',
  firstLastname: 'Pérez',
  secondLastname: 'García',
  phone: '3001234567',
  email: 'juan.perez@example.com',
  status: 'ACTIVE',
  createdAt: new Date('2025-01-01'),
  users: [
    {
      id: 1,
      email: 'juan.perez@example.com',
      status: 'ACTIVE',
      role: {
        id: 2,
        name: 'driver',
      },
    },
  ],
  personDocumentLinks: [
    {
      id: 1,
      documentRole: 'DRIVER_ID',
      personDocument: {
        id: 1,
        documentNumber: '1234567890',
        description: 'Cédula de ciudadanía',
        status: 'ACTIVE',
        documentType: {
          id: 1,
          name: 'CC',
        },
      },
    },
  ],
};

export const driverInDatabaseList = [
  {
    id: 1,
    personType: 'DRIVER',
    firstName: 'Juan',
    middleName: 'Carlos',
    firstLastname: 'Pérez',
    secondLastname: 'García',
    phone: '3001234567',
    email: 'juan.perez@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-01'),
    users: [],
    personDocumentLinks: [
      {
        id: 1,
        documentRole: 'DRIVER_ID',
        personDocument: {
          id: 1,
          documentNumber: '1234567890',
          description: 'Cédula de ciudadanía',
          status: 'ACTIVE',
          documentType: {
            id: 1,
            name: 'CC',
          },
        },
      },
    ],
  },
  {
    id: 2,
    personType: 'DRIVER',
    firstName: 'María',
    middleName: null,
    firstLastname: 'López',
    secondLastname: null,
    phone: '3009876543',
    email: 'maria.lopez@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2025-01-02'),
    users: [],
    personDocumentLinks: [
      {
        id: 2,
        documentRole: 'DRIVER_ID',
        personDocument: {
          id: 2,
          documentNumber: '9876543210',
          status: 'ACTIVE',
          documentType: {
            id: 1,
            name: 'CC',
          },
        },
      },
    ],
  },
] as any[];

export const duplicateEmailError = {
  success: false,
  message: 'No se pudo crear el conductor',
  errors: ['Ya existe una persona con ese email'],
};

export const driverNotFoundError = {
  success: false,
  message: 'Conductor no encontrado',
};

export const driverAlreadyInactiveError = {
  success: false,
  message: 'No se pudo inactivar el conductor',
  errors: ['El conductor ya se encuentra inactivo'],
};
