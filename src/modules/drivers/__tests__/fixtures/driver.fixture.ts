export const validDriverDocument = {
  documentType: 'CC',
  documentNumber: '1234567890',
  description: 'Cédula de ciudadanía',
  documentRole: 'DRIVER_ID',
};

export const validDriverLicenseDocument = {
  documentType: 'LICENCIA',
  documentNumber: 'LIC-987654',
  description: 'Licencia de conducción',
  documentRole: 'DRIVER_LICENSE',
};

export const validCreateDriverDto = {
  firstName: 'Juan',
  middleName: 'Carlos',
  firstLastname: 'Pérez',
  secondLastname: 'García',
  phone: '3001234567',
  email: 'juan.perez@example.com',
  documents: [validDriverDocument, validDriverLicenseDocument],
};

export const validCreateDriverDtoWithoutOptionals = {
  firstName: 'María',
  firstLastname: 'López',
  email: 'maria.lopez@example.com',
  phone: '3009876543',
  documents: [
    {
      documentType: 'CC',
      documentNumber: '9876543210',
    },
    {
      documentType: 'LICENCIA',
      documentNumber: 'LIC-123456',
    },
  ],
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
    {
      id: 2,
      documentRole: 'DRIVER_LICENSE',
      personDocument: {
        id: 2,
        documentNumber: 'LIC-987654',
        description: 'Licencia de conducción',
        status: 'ACTIVE',
        documentType: {
          id: 2,
          name: 'LICENCIA',
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
      {
        id: 2,
        documentRole: 'DRIVER_LICENSE',
        personDocument: {
          id: 2,
          documentNumber: 'LIC-987654',
          description: 'Licencia de conducción',
          status: 'ACTIVE',
          documentType: {
            id: 2,
            name: 'LICENCIA',
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
      {
        id: 3,
        documentRole: 'DRIVER_LICENSE',
        personDocument: {
          id: 3,
          documentNumber: 'LIC-123456',
          status: 'ACTIVE',
          documentType: {
            id: 2,
            name: 'LICENCIA',
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
