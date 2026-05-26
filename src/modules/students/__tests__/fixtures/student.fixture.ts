export const validStudentDocument = {
  documentType: 'TI',
  documentNumber: '98765432109',
  description: 'Tarjeta de Identidad',
  createPersonDocumentLink: true,
  documentRole: 'student',
};

export const validStudentAddress = {
  address: 'Carrera 5 #10-20, Tunja',
  latitude: 5.548,
  longitude: -73.36,
};

export const validCreateStudentDto = {
  guardianId: 1,
  firstName: 'Pedro',
  middleName: 'Antonio',
  firstLastname: 'López',
  secondLastname: 'Martínez',
  phone: '3101234567',
  email: 'pedro.lopez@example.com',
  document: validStudentDocument,
  addresses: [validStudentAddress],
};

export const validUpdateStudentDto = {
  guardianId: 1,
  firstName: 'Peter',
  firstLastname: 'López',
  email: 'peter.lopez@example.com',
  status: 'ACTIVE',
};

export const studentInDatabase = {
  id: 1,
  personType: 'STUDENT',
  guardianId: 1,
  firstName: 'Pedro',
  middleName: 'Antonio',
  firstLastname: 'López',
  secondLastname: 'Martínez',
  phone: '3101234567',
  email: 'pedro.lopez@example.com',
  status: 'ACTIVE',
  createdAt: new Date('2026-03-24'),
  updatedAt: new Date('2026-03-24'),
  addresses: [
    {
      id: 1,
      personId: 1,
      address: 'Carrera 5 #10-20, Tunja',
      latitude: 5.548,
      longitude: -73.36,
      zone: 'LA_RAZA',
    },
  ],
  guardian: {
    id: 1,
    firstName: 'Juan',
    firstLastname: 'Pérez',
    email: 'juan.perez@example.com',
  },
  personDocumentLinks: [],
  personAddresses: [],
} as any;

export const studentInDatabaseListForQuery = [
  {
    id: 1,
    personType: 'STUDENT',
    guardianId: 1,
    firstName: 'Pedro',
    middleName: 'Antonio',
    firstLastname: 'López',
    secondLastname: 'Martínez',
    email: 'pedro.lopez@example.com',
    phone: '3101234567',
    status: 'ACTIVE',
  },
  {
    id: 2,
    personType: 'STUDENT',
    guardianId: 2,
    firstName: 'Ana',
    middleName: null,
    firstLastname: 'García',
    secondLastname: 'Rodríguez',
    email: 'ana.garcia@example.com',
    phone: null,
    status: 'ACTIVE',
  },
] as any[];

export const studentInDatabaseList = studentInDatabaseListForQuery;

export const guardianNotFoundError = {
  message: 'Guardian not found',
};

export const invalidAddressError = {
  field: 'addresses',
  message: 'At least one address is required',
};
