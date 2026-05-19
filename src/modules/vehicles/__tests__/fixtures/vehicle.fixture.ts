export const validCreateVehicleDto = {
  plate: 'ABC-123',
  passengerCapacity: 30,
  brand: 'Toyota',
  model: 'Hiace',
  year: 2023,
  documents: {
    soat: {
      documentNumber: 'SOAT-001',
      issueDate: '2023-01-15T00:00:00Z',
      expiryDate: '2024-01-15T00:00:00Z',
      fileUrl: 'https://example.com/soat.pdf',
    },
    technicalInspection: {
      documentNumber: 'TI-001',
      issueDate: '2023-01-15T00:00:00Z',
      expiryDate: '2024-01-15T00:00:00Z',
      fileUrl: 'https://example.com/ti.pdf',
    },
    insurance: {
      documentNumber: 'INS-001',
      issueDate: '2023-01-15T00:00:00Z',
      expiryDate: '2024-01-15T00:00:00Z',
      fileUrl: 'https://example.com/insurance.pdf',
    },
    propertyCard: {
      documentNumber: 'PC-001',
      issueDate: '2023-01-15T00:00:00Z',
      expiryDate: '2024-01-15T00:00:00Z',
      fileUrl: 'https://example.com/pc.pdf',
    },
  },
};

export const validCreateVehicleDtoWithoutOptionals = {
  plate: 'DEF-456',
  passengerCapacity: 25,
  documents: {
    soat: {
      documentNumber: 'SOAT-002',
    },
    technicalInspection: {
      documentNumber: 'TI-002',
    },
    insurance: {
      documentNumber: 'INS-002',
    },
    propertyCard: {
      documentNumber: 'PC-002',
    },
  },
};

export const updateVehicleDto = {
  passengerCapacity: 35,
  brand: 'Mercedes',
  model: 'Sprinter',
  year: 2024,
};

export const vehicleInDatabase = {
  plate: 'ABC-123',
  passengerCapacity: 30,
  brand: 'Toyota',
  model: 'Hiace',
  year: 2023,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-15'),
  soat: {
    id: 1,
    documentType: 'SOAT',
    documentNumber: 'SOAT-001',
    issueDate: new Date('2023-01-15'),
    expiryDate: new Date('2024-01-15'),
    fileUrl: 'https://example.com/soat.pdf',
    status: 'ACTIVE',
  },
  technicalInspection: {
    id: 2,
    documentType: 'TECHNICAL_INSPECTION',
    documentNumber: 'TI-001',
    issueDate: new Date('2023-01-15'),
    expiryDate: new Date('2024-01-15'),
    fileUrl: 'https://example.com/ti.pdf',
    status: 'ACTIVE',
  },
  insurance: {
    id: 3,
    documentType: 'INSURANCE',
    documentNumber: 'INS-001',
    issueDate: new Date('2023-01-15'),
    expiryDate: new Date('2024-01-15'),
    fileUrl: 'https://example.com/insurance.pdf',
    status: 'ACTIVE',
  },
  propertyCard: {
    id: 4,
    documentType: 'PROPERTY_CARD',
    documentNumber: 'PC-001',
    issueDate: new Date('2023-01-15'),
    expiryDate: new Date('2024-01-15'),
    fileUrl: 'https://example.com/pc.pdf',
    status: 'ACTIVE',
  },
};

export const vehicleInDatabaseList = [
  vehicleInDatabase,
  {
    plate: 'DEF-456',
    passengerCapacity: 25,
    brand: 'Hyundai',
    model: 'H350',
    year: 2022,
    status: 'ACTIVE',
    createdAt: new Date('2023-12-10'),
    soat: null,
    technicalInspection: null,
    insurance: null,
    propertyCard: null,
  },
];

export const duplicatePlateError = {
  success: false,
  message: 'No se pudo crear el vehiculo',
  errors: ['Ya existe un vehiculo registrado con esa placa'],
};

export const vehicleNotFoundError = {
  success: false,
  message: 'Vehiculo no encontrado',
};

export const invalidCapacityError = {
  success: false,
  message: 'No se pudo crear el vehiculo',
  errors: ['La capacidad de pasajeros debe ser mayor a 1'],
};

export const vehicleAlreadyInactiveError = {
  success: false,
  message: 'El vehiculo ya se encuentra inactivo',
};
