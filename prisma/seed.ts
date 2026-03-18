import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ─────────────────────────────────────────────
  // 1. ROLES
  // ─────────────────────────────────────────────
  const roleAdmin = await prisma.role.create({ data: { name: 'ADMIN' } });
  const roleDriver = await prisma.role.create({ data: { name: 'DRIVER' } });
  const roleMonitor = await prisma.role.create({ data: { name: 'MONITOR' } });


  // ─────────────────────────────────────────────
  // 2. VEHICLE DOCUMENTS
  // ─────────────────────────────────────────────
  const soatDoc = await prisma.vehicleDocument.create({
    data: {
      documentType: 'SOAT',
      documentNumber: 'SOAT-2024-001',
      issueDate: new Date('2024-01-15'),
      expiryDate: new Date('2025-01-15'),
      fileUrl: 'https://storage.rutasegura.com/docs/soat_001.pdf',
      status: 'ACTIVE',
    },
  });

  const technicalDoc = await prisma.vehicleDocument.create({
    data: {
      documentType: 'TECHNICAL_INSPECTION',
      documentNumber: 'TECH-2024-001',
      issueDate: new Date('2024-03-10'),
      expiryDate: new Date('2026-03-10'),
      fileUrl: 'https://storage.rutasegura.com/docs/tech_001.pdf',
      status: 'ACTIVE',
    },
  });

  const insuranceDoc = await prisma.vehicleDocument.create({
    data: {
      documentType: 'INSURANCE',
      documentNumber: 'SEG-2024-001',
      issueDate: new Date('2024-01-01'),
      expiryDate: new Date('2025-01-01'),
      fileUrl: 'https://storage.rutasegura.com/docs/insurance_001.pdf',
      status: 'ACTIVE',
    },
  });

  const propertyCardDoc = await prisma.vehicleDocument.create({
    data: {
      documentType: 'PROPERTY_CARD',
      documentNumber: 'PROP-2020-001',
      issueDate: new Date('2020-06-20'),
      expiryDate: null,
      fileUrl: 'https://storage.rutasegura.com/docs/property_001.pdf',
      status: 'ACTIVE',
    },
  });

  const soatDoc2 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'SOAT',
      documentNumber: 'SOAT-2024-002',
      issueDate: new Date('2024-02-01'),
      expiryDate: new Date('2025-02-01'),
      status: 'ACTIVE',
    },
  });

  const technicalDoc2 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'TECHNICAL_INSPECTION',
      documentNumber: 'TECH-2024-002',
      issueDate: new Date('2024-04-01'),
      expiryDate: new Date('2026-04-01'),
      status: 'ACTIVE',
    },
  });


  // ─────────────────────────────────────────────
  // 3. VEHICLES
  // ─────────────────────────────────────────────
  const vehicle1 = await prisma.vehicle.create({
    data: {
      plate: 'ABC-123',
      passengerCapacity: 30,
      brand: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2020,
      status: 'ACTIVE',
      soatId: soatDoc.id,
      technicalInspectionId: technicalDoc.id,
      insuranceId: insuranceDoc.id,
      propertyCardId: propertyCardDoc.id,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      plate: 'XYZ-789',
      passengerCapacity: 20,
      brand: 'Toyota',
      model: 'Coaster',
      year: 2019,
      status: 'ACTIVE',
      soatId: soatDoc2.id,
      technicalInspectionId: technicalDoc2.id,
    },
  });


  // ─────────────────────────────────────────────
  // 4. PERSON DOCUMENTS
  // ─────────────────────────────────────────────
  const licenseDoc = await prisma.personDocument.create({
    data: {
      documentNumber: '1098765432',
      documentType: 'CEDULA',
      description: 'Cédula de ciudadanía',
      issueDate: new Date('2010-05-15'),
      status: 'ACTIVE',
    },
  });

  const driverLicenseDoc = await prisma.personDocument.create({
    data: {
      documentNumber: 'LIC-C2-00123',
      documentType: 'LICENCIA_CONDUCCION',
      description: 'Licencia categoría C2',
      issueDate: new Date('2018-08-01'),
      expiryDate: new Date('2028-08-01'),
      fileUrl: 'https://storage.rutasegura.com/docs/licencia_00123.pdf',
      status: 'ACTIVE',
    },
  });

  const adminCedula = await prisma.personDocument.create({
    data: {
      documentNumber: '1020304050',
      documentType: 'CEDULA',
      description: 'Cédula de ciudadanía',
      issueDate: new Date('2008-03-10'),
      status: 'ACTIVE',
    },
  });

  const monitorCedula = await prisma.personDocument.create({
    data: {
      documentNumber: '9988776655',
      documentType: 'CEDULA',
      description: 'Cédula de ciudadanía',
      issueDate: new Date('2012-07-22'),
      status: 'ACTIVE',
    },
  });

  // Documentos para estudiantes menores (cédulas de extranjería / TI)
  const student1Doc = await prisma.personDocument.create({
    data: {
      documentNumber: 'TI-1234567890',
      documentType: 'TARJETA_IDENTIDAD',
      description: 'Tarjeta de identidad menor',
      status: 'ACTIVE',
    },
  });

  const student2Doc = await prisma.personDocument.create({
    data: {
      documentNumber: 'TI-0987654321',
      documentType: 'TARJETA_IDENTIDAD',
      description: 'Tarjeta de identidad menor',
      status: 'ACTIVE',
    },
  });

  // Documentos para acudientes
  const guardian1Doc = await prisma.personDocument.create({
    data: {
      documentNumber: '5544332211',
      documentType: 'CEDULA',
      description: 'Cédula acudiente 1',
      status: 'ACTIVE',
    },
  });

  const guardian2Doc = await prisma.personDocument.create({
    data: {
      documentNumber: '6677889900',
      documentType: 'CEDULA',
      description: 'Cédula acudiente 2',
      status: 'ACTIVE',
    },
  });


  // ─────────────────────────────────────────────
  // 5. GUARDIANS
  // ─────────────────────────────────────────────
  const guardian1 = await prisma.guardian.create({
    data: {
      documentId: guardian1Doc.id,
      firstName: 'Carlos',
      firstLastname: 'Ramírez',
      secondLastname: 'Gómez',
      phone: '3101234567',
      email: 'carlos.ramirez@email.com',
      status: 'ACTIVE',
    },
  });

  const guardian2 = await prisma.guardian.create({
    data: {
      documentId: guardian2Doc.id,
      firstName: 'Lucía',
      firstLastname: 'Torres',
      secondLastname: 'Vargas',
      phone: '3209876543',
      email: 'lucia.torres@email.com',
      status: 'ACTIVE',
    },
  });


  // ─────────────────────────────────────────────
  // 6. PERSONS
  // ─────────────────────────────────────────────
  // Conductor
  const driverPerson = await prisma.person.create({
    data: {
      firstName: 'Andrés',
      middleName: 'Felipe',
      firstLastname: 'Moreno',
      secondLastname: 'Castro',
      phone: '3001112222',
      email: 'andres.moreno@rutasegura.com',
      status: 'ACTIVE',
    },
  });

  // Admin
  const adminPerson = await prisma.person.create({
    data: {
      firstName: 'Laura',
      firstLastname: 'Jiménez',
      secondLastname: 'Pérez',
      phone: '3153334444',
      email: 'laura.jimenez@rutasegura.com',
      status: 'ACTIVE',
    },
  });

  // Monitor
  const monitorPerson = await prisma.person.create({
    data: {
      firstName: 'Sebastián',
      firstLastname: 'Ortiz',
      phone: '3175556666',
      email: 'sebastian.ortiz@rutasegura.com',
      status: 'ACTIVE',
    },
  });

  // Estudiantes (con acudiente)
  const student1 = await prisma.person.create({
    data: {
      guardianId: guardian1.id,
      firstName: 'Sofía',
      firstLastname: 'Ramírez',
      secondLastname: 'López',
      status: 'ACTIVE',
    },
  });

  const student2 = await prisma.person.create({
    data: {
      guardianId: guardian2.id,
      firstName: 'Miguel',
      firstLastname: 'Torres',
      status: 'ACTIVE',
    },
  });


  // ─────────────────────────────────────────────
  // 7. PERSON DOCUMENT LINKS
  // ─────────────────────────────────────────────
  await prisma.personDocumentLink.createMany({
    data: [
      { personId: driverPerson.id, personDocumentId: licenseDoc.id, documentRole: 'CEDULA' },
      { personId: driverPerson.id, personDocumentId: driverLicenseDoc.id, documentRole: 'LICENCIA' },
      { personId: adminPerson.id, personDocumentId: adminCedula.id, documentRole: 'CEDULA' },
      { personId: monitorPerson.id, personDocumentId: monitorCedula.id, documentRole: 'CEDULA' },
      { personId: student1.id, personDocumentId: student1Doc.id, documentRole: 'TARJETA_IDENTIDAD' },
      { personId: student2.id, personDocumentId: student2Doc.id, documentRole: 'TARJETA_IDENTIDAD' },
    ],
  });


  // ─────────────────────────────────────────────
  // 8. USERS
  // ─────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@rutasegura.com',
      password: hashedPassword,
      personId: adminPerson.id,
      roleId: roleAdmin.id,
      status: 'ACTIVE',
      pickupEnabled: false,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'conductor@rutasegura.com',
      password: hashedPassword,
      personId: driverPerson.id,
      roleId: roleDriver.id,
      status: 'ACTIVE',
      pickupEnabled: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'monitor@rutasegura.com',
      password: hashedPassword,
      personId: monitorPerson.id,
      roleId: roleMonitor.id,
      status: 'ACTIVE',
      pickupEnabled: false,
    },
  });


  // ─────────────────────────────────────────────
  // 9. ADDRESSES
  // ─────────────────────────────────────────────
  const hqAddress = await prisma.address.create({
    data: {
      address: 'Calle 100 # 15-20, Bogotá',
      latitude: 4.6869847,
      longitude: -74.0474575,
      status: 'ACTIVE',
    },
  });

  const hqAddress2 = await prisma.address.create({
    data: {
      address: 'Carrera 7 # 32-16, Bogotá',
      latitude: 4.6387854,
      longitude: -74.0640169,
      status: 'ACTIVE',
    },
  });

  const student1Address = await prisma.address.create({
    data: {
      address: 'Calle 45 # 22-10, Bogotá',
      latitude: 4.6527762,
      longitude: -74.0603081,
      status: 'ACTIVE',
    },
  });

  const student2Address = await prisma.address.create({
    data: {
      address: 'Transversal 50 # 12-33, Bogotá',
      latitude: 4.6345123,
      longitude: -74.0812456,
      status: 'ACTIVE',
    },
  });


  // ─────────────────────────────────────────────
  // 10. HEADQUARTERS
  // ─────────────────────────────────────────────
  const hq1 = await prisma.headquarters.create({
    data: {
      name: 'Sede Norte',
      addressId: hqAddress.id,
      description: 'Sede principal zona norte de Bogotá',
    },
  });

  const hq2 = await prisma.headquarters.create({
    data: {
      name: 'Sede Centro',
      addressId: hqAddress2.id,
      description: 'Sede zona centro de Bogotá',
    },
  });


  // ─────────────────────────────────────────────
  // 11. PERSON ADDRESSES
  // ─────────────────────────────────────────────
  const personAddress1 = await prisma.personAddress.create({
    data: { personId: student1.id, addressId: student1Address.id },
  });

  const personAddress2 = await prisma.personAddress.create({
    data: { personId: student2.id, addressId: student2Address.id },
  });


  // ─────────────────────────────────────────────
  // 12. ROUTES
  // ─────────────────────────────────────────────
  const route1 = await prisma.route.create({
    data: {
      name: 'Ruta Norte Mañana',
      startTime: new Date('1970-01-01T06:00:00Z'),
      endTime: new Date('1970-01-01T07:30:00Z'),
      status: 'ACTIVE',
      vehiclePlate: vehicle1.plate,
      driverPersonId: driverPerson.id,
    },
  });

  const route2 = await prisma.route.create({
    data: {
      name: 'Ruta Sur Tarde',
      startTime: new Date('1970-01-01T15:00:00Z'),
      endTime: new Date('1970-01-01T16:30:00Z'),
      status: 'ACTIVE',
      vehiclePlate: vehicle2.plate,
      driverPersonId: driverPerson.id,
    },
  });


  // ─────────────────────────────────────────────
  // 13. STOPS
  // ─────────────────────────────────────────────
  const stop1 = await prisma.stop.create({
    data: {
      routeId: route1.id,
      stopOrder: 1,
      description: 'Parada Calle 45 - Estudiante Sofía',
      latitude: 4.6527762,
      longitude: -74.0603081,
      estimatedTime: new Date('1970-01-01T06:15:00Z'),
    },
  });

  const stop2 = await prisma.stop.create({
    data: {
      routeId: route1.id,
      stopOrder: 2,
      description: 'Parada Transversal 50 - Estudiante Miguel',
      latitude: 4.6345123,
      longitude: -74.0812456,
      estimatedTime: new Date('1970-01-01T06:30:00Z'),
    },
  });

  const stop3 = await prisma.stop.create({
    data: {
      routeId: route1.id,
      stopOrder: 3,
      description: 'Sede Norte - Destino final',
      latitude: 4.6869847,
      longitude: -74.0474575,
      estimatedTime: new Date('1970-01-01T07:00:00Z'),
    },
  });

  const stop4 = await prisma.stop.create({
    data: {
      routeId: route2.id,
      stopOrder: 1,
      description: 'Sede Centro - Salida',
      latitude: 4.6387854,
      longitude: -74.0640169,
      estimatedTime: new Date('1970-01-01T15:00:00Z'),
    },
  });


  // ─────────────────────────────────────────────
  // 14. ROUTE ASSIGNMENTS
  // ─────────────────────────────────────────────
  const assignment1 = await prisma.routeAssignment.create({
    data: {
      personId: student1.id,
      routeId: route1.id,
      stopId: stop1.id,
      personAddressId: personAddress1.id,
      startDate: new Date('2025-01-20'),
      status: 'ACTIVE',
    },
  });

  const assignment2 = await prisma.routeAssignment.create({
    data: {
      personId: student2.id,
      routeId: route1.id,
      stopId: stop2.id,
      personAddressId: personAddress2.id,
      startDate: new Date('2025-01-20'),
      status: 'ACTIVE',
    },
  });


  // ─────────────────────────────────────────────
  // 15. ROUTE ASSIGNMENT HEADQUARTERS
  // ─────────────────────────────────────────────
  await prisma.routeAssignmentHeadquarters.createMany({
    data: [
      { routeAssignmentId: assignment1.id, headquartersId: hq1.id },
      { routeAssignmentId: assignment2.id, headquartersId: hq1.id },
    ],
  });


  // ─────────────────────────────────────────────
  // 16. TRIPS
  // ─────────────────────────────────────────────
  const trip1 = await prisma.trip.create({
    data: {
      routeId: route1.id,
      vehiclePlate: vehicle1.plate,
      driverPersonId: driverPerson.id,
      tripDate: new Date('2025-03-17'),
      status: 'COMPLETED',
      startedAt: new Date('2025-03-17T06:02:00Z'),
      endedAt: new Date('2025-03-17T07:25:00Z'),
      observations: 'Viaje sin novedades',
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      routeId: route1.id,
      vehiclePlate: vehicle1.plate,
      driverPersonId: driverPerson.id,
      tripDate: new Date('2025-03-18'),
      status: 'IN_PROGRESS',
      startedAt: new Date('2025-03-18T06:01:00Z'),
    },
  });


  // ─────────────────────────────────────────────
  // 17. CHECKLISTS
  // ─────────────────────────────────────────────
  const checklist1 = await prisma.checklist.create({
    data: {
      tripId: trip1.id,
      vehiclePlate: vehicle1.plate,
      reviewedByUserId: driverUser.id,
      status: 'APPROVED',
      generalObservations: 'Vehículo en perfectas condiciones',
    },
  });

  const checklist2 = await prisma.checklist.create({
    data: {
      tripId: trip2.id,
      vehiclePlate: vehicle1.plate,
      reviewedByUserId: driverUser.id,
      status: 'APPROVED',
      generalObservations: 'Leve desgaste en llanta delantera derecha',
    },
  });


  // ─────────────────────────────────────────────
  // 18. CHECKLIST ITEMS
  // ─────────────────────────────────────────────
  const checklistItems = [
    { itemName: 'Frenos', passed: true },
    { itemName: 'Luces delanteras', passed: true },
    { itemName: 'Luces traseras', passed: true },
    { itemName: 'Llantas', passed: true },
    { itemName: 'Cinturones de seguridad', passed: true },
    { itemName: 'Extintor', passed: true },
    { itemName: 'Botiquín', passed: true },
    { itemName: 'Retrovisores', passed: true },
  ];

  await prisma.checklistItem.createMany({
    data: checklistItems.map((item) => ({ checklistId: checklist1.id, ...item })),
  });

  await prisma.checklistItem.createMany({
    data: checklistItems.map((item, i) => ({
      checklistId: checklist2.id,
      ...item,
      passed: i === 3 ? false : item.passed, // Llantas en mal estado
      observations: i === 3 ? 'Desgaste visible en llanta delantera derecha' : undefined,
    })),
  });


  // ─────────────────────────────────────────────
  // 19. DOCUMENT ALERTS
  // ─────────────────────────────────────────────
  await prisma.documentAlert.createMany({
    data: [
      {
        vehicleDocumentId: soatDoc.id,
        vehiclePlate: vehicle1.plate,
        alertType: 'EXPIRY_WARNING',
        message: 'El SOAT del vehículo ABC-123 vence en 15 días',
        documentExpiryDate: new Date('2025-01-15'),
        daysRemaining: 15,
        isRead: false,
      },
      {
        vehicleDocumentId: insuranceDoc.id,
        vehiclePlate: vehicle1.plate,
        alertType: 'EXPIRY_WARNING',
        message: 'El seguro del vehículo ABC-123 vence en 30 días',
        documentExpiryDate: new Date('2025-01-01'),
        daysRemaining: 30,
        isRead: true,
        readAt: new Date('2025-03-15T10:00:00Z'),
      },
      {
        personDocumentId: driverLicenseDoc.id,
        personId: driverPerson.id,
        alertType: 'EXPIRY_INFO',
        message: 'La licencia de conducción de Andrés Moreno vence en 2028',
        documentExpiryDate: new Date('2028-08-01'),
        daysRemaining: 1231,
        isRead: false,
      },
    ],
  });


  // ─────────────────────────────────────────────
  // 20. VEHICLE STATUS HISTORY
  // ─────────────────────────────────────────────
  await prisma.vehicleStatusHistory.createMany({
    data: [
      {
        vehiclePlate: vehicle1.plate,
        previousStatus: null,
        newStatus: 'ACTIVE',
        reason: 'Registro inicial del vehículo',
        responsibleUser: 'admin@rutasegura.com',
      },
      {
        vehiclePlate: vehicle2.plate,
        previousStatus: null,
        newStatus: 'ACTIVE',
        reason: 'Registro inicial del vehículo',
        responsibleUser: 'admin@rutasegura.com',
      },
      {
        vehiclePlate: vehicle1.plate,
        previousStatus: 'ACTIVE',
        newStatus: 'MAINTENANCE',
        reason: 'Revisión preventiva programada',
        responsibleUser: 'admin@rutasegura.com',
        changedAt: new Date('2025-02-10T08:00:00Z'),
      },
      {
        vehiclePlate: vehicle1.plate,
        previousStatus: 'MAINTENANCE',
        newStatus: 'ACTIVE',
        reason: 'Mantenimiento completado sin novedades',
        responsibleUser: 'admin@rutasegura.com',
        changedAt: new Date('2025-02-12T16:00:00Z'),
      },
    ],
  });

  console.log('   Admin:    admin@rutasegura.com     / password123');
  console.log('   Conductor: conductor@rutasegura.com / password123');
  console.log('   Monitor:  monitor@rutasegura.com   / password123');
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
