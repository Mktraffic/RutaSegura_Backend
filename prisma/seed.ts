import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const range = (count: number) => Array.from({ length: count }, (_, i) => i);
  const dateFrom = (base: Date, days: number) =>
    new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  const timeAt = (hour: number, minute: number) => {
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return new Date(`1970-01-01T${hh}:${mm}:00Z`);
  };

  const baseDate = new Date('2025-01-01T00:00:00Z');

  // Clean database in FK-safe order
  await prisma.$transaction([
    prisma.documentAlert.deleteMany(),
    prisma.checklistItem.deleteMany(),
    prisma.checklist.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.routeAssignmentHeadquarters.deleteMany(),
    prisma.routeAssignment.deleteMany(),
    prisma.stop.deleteMany(),
    prisma.route.deleteMany(),
    prisma.vehicleStatusHistory.deleteMany(),
    prisma.user.deleteMany(),
    prisma.personAddress.deleteMany(),
    prisma.personDocumentLink.deleteMany(),
    prisma.person.deleteMany(),
    prisma.guardian.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.vehicleDocument.deleteMany(),
    prisma.headquarters.deleteMany(),
    prisma.address.deleteMany(),
    prisma.personDocument.deleteMany(),
    prisma.documentType.deleteMany(),
    prisma.role.deleteMany(),
    prisma.checklistTemplate.deleteMany(),
    prisma.zone.deleteMany(),
  ]);

  // ─────────────────────────────────────────────
  // 1. DOCUMENT TYPES (10)
  // ─────────────────────────────────────────────
  const personDocumentTypes = [
    'Cedula de ciudadania',
    'Tarjeta de identidad',
    'Pasaporte',
    'Licencia de conduccion',
    'Cedula de extranjeria',
    'Registro civil',
    'Permiso especial',
    'Documento temporal',
    'Carnet estudiantil',
    'Otro',
  ];

  await prisma.documentType.createMany({
    data: personDocumentTypes.map((name) => ({ name })),
  });

  const documentTypes = await prisma.documentType.findMany({
    orderBy: { id: 'asc' },
  });

  if (documentTypes.length < 10) {
    throw new Error('No se pudo cargar el catalogo base de tipos de documento');
  }

  // ─────────────────────────────────────────────
  // 2. ROLES (10)
  // ─────────────────────────────────────────────
  const roleNames = [
    'ADMIN',
    'COORDINATOR',
    'DRIVER',
    'DISPATCH',
    'SUPPORT',
    'VIEWER',
    'SUPERVISOR',
    'AUDITOR',
    'MANAGER',
    'OWNER',
  ];

  await prisma.role.createMany({ data: roleNames.map((name) => ({ name })) });
  const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } });
  const roleAdmin = roles.find((role) => role.name === 'ADMIN');
  const roleCoordinator = roles.find((role) => role.name === 'COORDINATOR');
  const roleDriver = roles.find((role) => role.name === 'DRIVER');

  if (!roleAdmin || !roleCoordinator || !roleDriver) {
    throw new Error('No se pudo cargar el catalogo base de roles');
  }

  // ─────────────────────────────────────────────
  // 3. ZONES (10)
  // ─────────────────────────────────────────────
  const zones = await Promise.all(
    range(10).map((i) =>
      prisma.zone.create({
        data: {
          name: `Zona ${i + 1}`,
          description: `Zona operativa ${i + 1}`,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 4. CHECKLIST TEMPLATES (10)
  // ─────────────────────────────────────────────
  await prisma.checklistTemplate.createMany({
    data: [
      { itemName: 'Frenos', required: true, status: 'ACTIVE' },
      { itemName: 'Llantas', required: true, status: 'ACTIVE' },
      { itemName: 'Luces delanteras', required: true, status: 'ACTIVE' },
      { itemName: 'Luces traseras', required: true, status: 'ACTIVE' },
      { itemName: 'Cinturones de seguridad', required: true, status: 'ACTIVE' },
      { itemName: 'Extintor', required: true, status: 'ACTIVE' },
      { itemName: 'Botiquin', required: true, status: 'ACTIVE' },
      { itemName: 'Retrovisores', required: true, status: 'ACTIVE' },
      { itemName: 'Nivel de combustible', required: true, status: 'ACTIVE' },
      { itemName: 'Nivel de aceite', required: true, status: 'ACTIVE' },
    ],
  });

  // ─────────────────────────────────────────────
  // 5. VEHICLE DOCUMENTS (10)
  // ─────────────────────────────────────────────
  const vehicleDocTypes = [
    'SOAT',
    'TECHNICAL_INSPECTION',
    'INSURANCE',
    'PROPERTY_CARD',
  ];

  const vehicleDocuments = await Promise.all(
    range(10).map((i) =>
      prisma.vehicleDocument.create({
        data: {
          documentType: vehicleDocTypes[i % vehicleDocTypes.length],
          documentNumber: `VDOC-${String(i + 1).padStart(4, '0')}`,
          issueDate: dateFrom(baseDate, i * 10),
          expiryDate: dateFrom(baseDate, i * 10 + 365),
          fileUrl: `https://storage.rutasegura.com/docs/vehicle_${i + 1}.pdf`,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 6. VEHICLES (10)
  // ─────────────────────────────────────────────
  const vehicles = await Promise.all(
    range(10).map((i) =>
      prisma.vehicle.create({
        data: {
          plate: `RS-${String(100 + i)}`,
          passengerCapacity: 12 + (i % 4),
          brand: ['Toyota', 'Chevrolet', 'Renault', 'Nissan'][i % 4],
          model: `Model-${2020 + (i % 4)}`,
          year: 2019 + (i % 6),
          status: 'ACTIVE',
          soatId: vehicleDocuments[i].id,
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 7. PERSON DOCUMENTS (10)
  // ─────────────────────────────────────────────
  const personDocuments = await Promise.all(
    range(10).map((i) =>
      prisma.personDocument.create({
        data: {
          documentTypeId: documentTypes[i].id,
          documentNumber: `PDOC-${String(1000 + i)}`,
          description: `Documento personal ${i + 1}`,
          issueDate: dateFrom(baseDate, -(365 * (2 + i))),
          expiryDate: dateFrom(baseDate, 365 * (2 + i)),
          fileUrl: `https://storage.rutasegura.com/docs/person_${i + 1}.pdf`,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 8. GUARDIANS (10)
  // ─────────────────────────────────────────────
  const guardians = await Promise.all(
    range(10).map((i) =>
      prisma.guardian.create({
        data: {
          documentId: personDocuments[i].id,
          firstName: `Guardian${i + 1}`,
          firstLastname: `Lastname${i + 1}`,
          phone: `31000000${String(i).padStart(2, '0')}`,
          email: `guardian${i + 1}@rutasegura.com`,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 9. PERSONS (30: 10 students, 10 drivers, 10 coordinators)
  // ─────────────────────────────────────────────
  const drivers = await Promise.all(
    range(10).map((i) =>
      prisma.person.create({
        data: {
          personType: 'DRIVER',
          firstName: `Driver${i + 1}`,
          firstLastname: `Lastname${i + 1}`,
          phone: `30000000${String(i).padStart(2, '0')}`,
          email: `driver${i + 1}@rutasegura.com`,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  const coordinators = await Promise.all(
    range(10).map((i) =>
      prisma.person.create({
        data: {
          personType: 'COORDINATOR',
          firstName: `Coordinator${i + 1}`,
          firstLastname: `Lastname${i + 1}`,
          phone: `31500000${String(i).padStart(2, '0')}`,
          email: `coordinator${i + 1}@rutasegura.com`,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  const students = await Promise.all(
    range(10).map((i) =>
      prisma.person.create({
        data: {
          personType: 'STUDENT',
          guardianId: guardians[i].id,
          firstName: `Student${i + 1}`,
          firstLastname: `Lastname${i + 1}`,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 10. PERSON DOCUMENT LINKS (10)
  // ─────────────────────────────────────────────
  await prisma.personDocumentLink.createMany({
    data: range(10).map((i) => ({
      personId: drivers[i].id,
      personDocumentId: personDocuments[i].id,
      documentRole: 'CEDULA',
    })),
  });

  // ─────────────────────────────────────────────
  // 11. USERS (10)
  // ─────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all(
    range(10).map((i) => {
      const isAdmin = i === 0;
      const isDriver = i >= 5;
      const person = isDriver ? drivers[i - 5] : coordinators[i];
      const roleId = isAdmin
        ? roleAdmin.id
        : isDriver
          ? roleDriver.id
          : roleCoordinator.id;

      return prisma.user.create({
        data: {
          email: `user${i + 1}@rutasegura.com`,
          password: hashedPassword,
          personId: person.id,
          roleId,
          status: 'ACTIVE',
          pickupEnabled: isDriver,
        },
      });
    }),
  );

  // ─────────────────────────────────────────────
  // 12. ADDRESSES (10)
  // ─────────────────────────────────────────────
  const addresses = await Promise.all(
    range(10).map((i) =>
      prisma.address.create({
        data: {
          address: `Calle ${10 + i} # ${5 + i}-${20 + i}, Tunja`,
          latitude: 5.53 + i * 0.002,
          longitude: -73.36 - i * 0.002,
          zoneId: zones[i].id,
          status: 'ACTIVE',
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 13. HEADQUARTERS (10)
  // ─────────────────────────────────────────────
  const headquarters = await Promise.all(
    range(10).map((i) =>
      prisma.headquarters.create({
        data: {
          name: `Sede ${i + 1}`,
          addressId: addresses[i].id,
          description: `Sede operativa ${i + 1}`,
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 14. PERSON ADDRESSES (10)
  // ─────────────────────────────────────────────
  const personAddresses = await Promise.all(
    range(10).map((i) =>
      prisma.personAddress.create({
        data: {
          personId: students[i].id,
          addressId: addresses[i].id,
          addressType: 'PRINCIPAL',
          validDays: null,
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 15. ROUTES (10)
  // ─────────────────────────────────────────────
  const routes = await Promise.all(
    range(10).map((i) =>
      prisma.route.create({
        data: {
          name: `Ruta ${i + 1}`,
          routeType: i % 2 === 0 ? 'PICKUP' : 'DROPOFF',
          zoneId: zones[i].id,
          originDescription: `Origen zona ${i + 1}`,
          destinationId: headquarters[i].id,
          startTime: timeAt(6, 0 + i),
          endTime: timeAt(7, 15 + i),
          status: 'ACTIVE',
          vehiclePlate: vehicles[i].plate,
          driverPersonId: drivers[i].id,
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 16. STOPS (10)
  // ─────────────────────────────────────────────
  const stops = await Promise.all(
    range(10).map((i) =>
      prisma.stop.create({
        data: {
          routeId: routes[i].id,
          stopOrder: 1,
          description: `Parada ${i + 1}`,
          latitude: 5.54 + i * 0.001,
          longitude: -73.35 - i * 0.001,
          estimatedTime: timeAt(6, 10 + i),
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 17. ROUTE ASSIGNMENTS (10)
  // ─────────────────────────────────────────────
  const routeAssignments = await Promise.all(
    range(10).map((i) =>
      prisma.routeAssignment.create({
        data: {
          personId: students[i].id,
          routeId: routes[i].id,
          stopId: stops[i].id,
          personAddressId: personAddresses[i].id,
          startDate: dateFrom(baseDate, i),
          status: 'ACTIVE',
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 18. ROUTE ASSIGNMENT HEADQUARTERS (10)
  // ─────────────────────────────────────────────
  await prisma.routeAssignmentHeadquarters.createMany({
    data: range(10).map((i) => ({
      routeAssignmentId: routeAssignments[i].id,
      headquartersId: headquarters[i].id,
    })),
  });

  // ─────────────────────────────────────────────
  // 19. TRIPS (10)
  // ─────────────────────────────────────────────
  const tripStatuses = ['PENDING_CHECKLIST', 'ENABLED', 'IN_PROGRESS', 'COMPLETED'];
  const trips = await Promise.all(
    range(10).map((i) =>
      prisma.trip.create({
        data: {
          routeId: routes[i].id,
          vehiclePlate: vehicles[i].plate,
          driverPersonId: drivers[i].id,
          tripDate: dateFrom(baseDate, 10 + i),
          status: tripStatuses[i % tripStatuses.length],
          startedAt: i % 2 === 0 ? dateFrom(baseDate, 10 + i) : null,
          endedAt: i % 3 === 0 ? dateFrom(baseDate, 10 + i) : null,
          observations: `Viaje ${i + 1}`,
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 20. CHECKLISTS (10)
  // ─────────────────────────────────────────────
  const checklists = await Promise.all(
    range(10).map((i) =>
      prisma.checklist.create({
        data: {
          tripId: trips[i].id,
          vehiclePlate: vehicles[i].plate,
          reviewedByUserId: users[i].id,
          status: i % 2 === 0 ? 'APPROVED' : 'PENDING',
          generalObservations: `Checklist ${i + 1}`,
        },
      }),
    ),
  );

  // ─────────────────────────────────────────────
  // 21. CHECKLIST ITEMS (10)
  // ─────────────────────────────────────────────
  await prisma.checklistItem.createMany({
    data: range(10).map((i) => ({
      checklistId: checklists[i].id,
      itemName: `Item ${i + 1}`,
      passed: i % 2 === 0,
      observations: i % 2 === 0 ? null : 'Requiere revision',
    })),
  });

  // ─────────────────────────────────────────────
  // 22. DOCUMENT ALERTS (10)
  // ─────────────────────────────────────────────
  await prisma.documentAlert.createMany({
    data: range(10).map((i) =>
      i < 5
        ? {
            vehicleDocumentId: vehicleDocuments[i].id,
            vehiclePlate: vehicles[i].plate,
            alertType: 'EXPIRY_WARNING',
            message: `Documento vehiculo ${i + 1} vence pronto`,
            documentExpiryDate: dateFrom(baseDate, 200 + i),
            daysRemaining: 200 + i,
            isRead: false,
          }
        : {
            personDocumentId: personDocuments[i - 5].id,
            personId: drivers[i - 5].id,
            alertType: 'EXPIRY_INFO',
            message: `Documento persona ${i - 4} al dia`,
            documentExpiryDate: dateFrom(baseDate, 300 + i),
            daysRemaining: 300 + i,
            isRead: i % 2 === 0,
            readAt: i % 2 === 0 ? dateFrom(baseDate, 100 + i) : null,
          },
    ),
  });

  // ─────────────────────────────────────────────
  // 23. VEHICLE STATUS HISTORY (10)
  // ─────────────────────────────────────────────
  await prisma.vehicleStatusHistory.createMany({
    data: range(10).map((i) => ({
      vehiclePlate: vehicles[i].plate,
      previousStatus: i % 2 === 0 ? null : 'MAINTENANCE',
      newStatus: i % 2 === 0 ? 'ACTIVE' : 'MAINTENANCE',
      reason: `Cambio de estado ${i + 1}`,
      responsibleUser: users[i].email,
      changedAt: dateFrom(baseDate, 30 + i),
    })),
  });

  console.log('✅ Seed completado');
  console.log('   Usuarios: user1@rutasegura.com .. user10@rutasegura.com / password123');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
