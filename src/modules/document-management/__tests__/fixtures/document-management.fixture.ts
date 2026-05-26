export const validCreateDocumentTypeDto = {
  name: 'Pasaporte',
};

export const invalidCreateDocumentTypeDto = {
  name: 'P',
};

export const updateDocumentTypeDto = {
  name: 'Cédula de Ciudadanía',
};

export const documentTypeInDatabase = {
  id: 1,
  name: 'Pasaporte',
};

export const documentTypeInDatabaseList = [
  {
    id: 1,
    name: 'Cédula de Ciudadanía',
  },
  {
    id: 2,
    name: 'Pasaporte',
  },
];

export const validCreatePersonDocumentDto = {
  personId: 1,
  documentType: 'Pasaporte',
  documentNumber: 'DOC123456',
  description: 'Documento de identificación',
  issueDate: '2020-01-15T00:00:00Z',
  expiryDate: '2025-01-15T00:00:00Z',
  fileUrl: 'https://example.com/doc.pdf',
  documentRole: 'PRIMARY',
};

export const updatePersonDocumentDto = {
  documentNumber: 'DOC789012',
  expiryDate: '2026-01-15T00:00:00Z',
};

export const personDocumentInDatabase = {
  id: 1,
  documentTypeId: 1,
  documentNumber: 'DOC123456',
  description: 'Documento de identificación',
  issueDate: new Date('2020-01-15'),
  expiryDate: new Date('2025-01-15'),
  fileUrl: 'https://example.com/doc.pdf',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-15'),
  documentType: {
    id: 1,
    name: 'Pasaporte',
  },
  personDocumentLinks: [
    {
      id: 1,
      personId: 1,
      documentRole: 'PRIMARY',
      person: {
        id: 1,
        firstName: 'Juan',
        firstLastname: 'Pérez',
      },
    },
  ],
};

export const personDocumentList = [
  {
    id: 1,
    documentTypeId: 1,
    documentNumber: 'DOC123456',
    description: 'Documento de identificación',
    issueDate: new Date('2020-01-15'),
    expiryDate: new Date('2025-01-15'),
    fileUrl: 'https://example.com/doc.pdf',
    status: 'ACTIVE',
    documentType: {
      id: 1,
      name: 'Pasaporte',
    },
    createdAt: new Date('2024-01-15'),
  },
];

export const validCreateVehicleDocumentDto = {
  vehiclePlate: 'ABC-123',
  documentType: 'SOAT' as const,
  documentNumber: 'VEH123456',
  issueDate: '2020-01-15T00:00:00Z',
  expiryDate: '2025-01-15T00:00:00Z',
  fileUrl: 'https://example.com/soat.pdf',
};

export const updateVehicleDocumentDto = {
  documentNumber: 'VEH789012',
  expiryDate: '2026-01-15T00:00:00Z',
};

export const vehicleDocumentInDatabase = {
  id: 1,
  vehiclePlate: 'ABC-123',
  documentType: 'SOAT',
  documentNumber: 'VEH123456',
  issueDate: new Date('2020-01-15'),
  expiryDate: new Date('2025-01-15'),
  fileUrl: 'https://example.com/soat.pdf',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-15'),
};

export const vehicleDocumentList = [
  {
    id: 1,
    vehiclePlate: 'ABC-123',
    documentType: 'SOAT',
    documentNumber: 'VEH123456',
    issueDate: new Date('2020-01-15'),
    expiryDate: new Date('2025-01-15'),
    fileUrl: 'https://example.com/soat.pdf',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-15'),
  },
];

export const alertInDatabase = {
  id: 1,
  documentId: 1,
  documentType: 'PERSON_DOCUMENT',
  expiryDate: new Date('2025-01-15'),
  alertDate: new Date('2024-12-16'),
  severity: 'MEDIUM',
  isRead: false,
  createdAt: new Date('2024-12-16'),
};

export const alertList = [
  {
    id: 1,
    documentId: 1,
    documentType: 'PERSON_DOCUMENT',
    expiryDate: new Date('2025-01-15'),
    alertDate: new Date('2024-12-16'),
    severity: 'MEDIUM',
    isRead: false,
    createdAt: new Date('2024-12-16'),
  },
];

export const documentNotFoundError = {
  success: false,
  message: 'Documento no encontrado',
};

export const documentTypeAlreadyExistsError = {
  success: false,
  message: 'No se pudo crear el tipo de documento',
  errors: ['Ya existe un tipo de documento con ese nombre'],
};
