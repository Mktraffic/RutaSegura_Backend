export const validCreateRouteDto = {
  name: 'Ruta Centro A',
  zoneId: 1,
  destinationId: 1,
  originDescription: 'Punto de salida centro',
  startTime: '06:30',
  endTime: '08:30',
  vehiclePlate: 'ABC-123',
  driverPersonId: 1,
  stops: [
    {
      stopOrder: 1,
      description: 'Parada 1',
      latitude: 4.7110,
      longitude: -74.0088,
      estimatedTime: '06:45',
    },
    {
      stopOrder: 2,
      description: 'Parada 2',
      latitude: 4.7150,
      longitude: -74.0100,
      estimatedTime: '07:00',
    },
  ],
};

export const updateRouteDto = {
  name: 'Ruta Centro A - Actualizada',
  endTime: '09:00',
};

export const routeInDatabase = {
  id: 1,
  name: 'Ruta Centro A',
  zoneId: 1,
  destinationId: 1,
  originDescription: 'Punto de salida centro',
  startTime: '06:30',
  endTime: '08:30',
  status: 'ACTIVE',
  vehiclePlate: 'ABC-123',
  driverPersonId: 1,
  createdAt: new Date('2024-01-15'),
  zone: {
    id: 1,
    name: 'Zona Centro',
  },
  destination: {
    id: 1,
    name: 'Destino Principal',
    address: {
      id: 1,
      address: 'Calle Principal 123',
      zoneId: 1,
    },
  },
  vehicle: {
    plate: 'ABC-123',
    brand: 'Toyota',
    model: 'Hiace',
    status: 'ACTIVE',
  },
  driver: {
    id: 1,
    firstName: 'Juan',
    firstLastname: 'Pérez',
    personType: 'DRIVER',
    status: 'ACTIVE',
  },
  stops: [
    {
      id: 1,
      stopOrder: 1,
      description: 'Parada 1',
      latitude: 4.7110,
      longitude: -74.0088,
      estimatedTime: '06:45',
    },
    {
      id: 2,
      stopOrder: 2,
      description: 'Parada 2',
      latitude: 4.7150,
      longitude: -74.0100,
      estimatedTime: '07:00',
    },
  ],
};

export const routeInDatabaseList = [
  routeInDatabase,
  {
    id: 2,
    name: 'Ruta Centro B',
    zoneId: 1,
    status: 'ACTIVE',
    destinationId: 1,
    originDescription: 'Punto de salida centro B',
    startTime: '07:00',
    endTime: '09:00',
    vehiclePlate: 'DEF-456',
    driverPersonId: 2,
    createdAt: new Date('2024-01-10'),
    zone: {
      id: 1,
      name: 'Zona Centro',
    },
    destination: {
      id: 1,
      name: 'Destino Principal',
      address: {
        id: 1,
        address: 'Calle Principal 123',
        zoneId: 1,
      },
    },
    vehicle: {
      plate: 'DEF-456',
      brand: 'Hyundai',
      model: 'H350',
      status: 'ACTIVE',
    },
    driver: {
      id: 2,
      firstName: 'Carlos',
      firstLastname: 'González',
      personType: 'DRIVER',
      status: 'ACTIVE',
    },
    stops: [],
  },
];

export const validCreateRouteAssignmentDto = {
  personId: 2,
  stopId: 1,
  personAddressId: 1,
};

export const updateRouteAssignmentDto = {
  stopId: 2,
};

export const routeAssignmentInDatabase = {
  id: 1,
  routeId: 1,
  personId: 2,
  stopId: 1,
  personAddressId: 1,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-15'),
  person: {
    id: 2,
    firstName: 'Carlos',
    firstLastname: 'González',
    personType: 'STUDENT',
    status: 'ACTIVE',
  },
  stop: {
    id: 1,
    stopOrder: 1,
    description: 'Parada 1',
    latitude: 4.7110,
    longitude: -74.0088,
    estimatedTime: '06:45',
  },
  personAddress: {
    id: 1,
    addressType: 'HOME',
    validDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
    address: {
      id: 1,
      address: 'Calle 5 No. 10-15',
      zoneId: 1,
    },
  },
};

export const routeAssignmentList = [
  routeAssignmentInDatabase,
  {
    id: 2,
    routeId: 1,
    personId: 3,
    status: 'ACTIVE',
    stopId: 2,
    personAddressId: 2,
    createdAt: new Date('2024-01-15'),
    person: {
      id: 3,
      firstName: 'María',
      firstLastname: 'López',
      personType: 'STUDENT',
      status: 'ACTIVE',
    },
    stop: {
      id: 2,
      stopOrder: 2,
      description: 'Parada 2',
      latitude: 4.7150,
      longitude: -74.0100,
      estimatedTime: '07:00',
    },
    personAddress: {
      id: 2,
      addressType: 'HOME',
      validDays: ['WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      address: {
        id: 2,
        address: 'Calle 10 No. 20-30',
        zoneId: 1,
      },
    },
  },
];

export const routeNotFoundError = {
  success: false,
  message: 'Ruta no encontrada',
};

export const invalidRouteTimeError = {
  success: false,
  message: 'No se pudo crear la ruta',
  errors: ['La hora de inicio debe ser antes que la hora de fin'],
};

export const routeAlreadyInactiveError = {
  success: false,
  message: 'La ruta ya se encuentra inactiva',
};
