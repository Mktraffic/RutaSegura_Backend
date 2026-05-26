export const validGuardianDocument = {
  documentType: 'CC',
  documentNumber: '1234567890',
  description: 'Cédula de ciudadanía',
};

export const validCreateGuardianDto = {
  document: validGuardianDocument,
  firstName: 'Juan',
  middleName: 'Carlos',
  firstLastname: 'Pérez',
  secondLastname: 'García',
  phone: '3001234567',
  email: 'juan.perez@example.com',
};

export const validGuardianWithoutOptionals = {
  document: validGuardianDocument,
  firstName: 'María',
  firstLastname: 'López',
  email: 'maria.lopez@example.com',
};

export const guardianInDatabase = {
  id: 1,
  documentId: 1,
  firstName: 'Juan',
  middleName: 'Carlos',
  firstLastname: 'Pérez',
  secondLastname: 'García',
  phone: '3001234567',
  email: 'juan.perez@example.com',
  status: 'ACTIVE',
  document: {
    id: 1,
    documentNumber: '1234567890',
    status: 'ACTIVE',
    documentType: {
      id: 1,
      name: 'CC',
    },
  },
};

export const guardianInDatabaseListForQuery = [
  {
    id: 1,
    firstName: 'Juan',
    middleName: 'Carlos',
    firstLastname: 'Pérez',
    secondLastname: 'García',
    email: 'juan.perez@example.com',
    phone: '3001234567',
    status: 'ACTIVE',
  },
  {
    id: 2,
    firstName: 'María',
    middleName: null,
    firstLastname: 'López',
    secondLastname: 'García',
    email: 'maria.lopez@example.com',
    phone: '3009876543',
    status: 'ACTIVE',
  },
] as any[];

export const guardianInDatabaseList = guardianInDatabaseListForQuery;

export const duplicateDocumentError = {
  success: false,
  message: 'No se pudo crear el acudiente',
  errors: ['Ya existe un documento con ese tipo y numero'],
};
