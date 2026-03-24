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
  const roleCoordinator = await prisma.role.create({ data: { name: 'COORDINATOR' } });
  const roleDriver      = await prisma.role.create({ data: { name: 'DRIVER' } });

  // ─────────────────────────────────────────────
  // 2. ZONAS
  // ─────────────────────────────────────────────
  const zoneNorth = await prisma.zone.create({
    data: { name: 'Zona Norte', description: 'Sector norte de Tunja', status: 'ACTIVE' },
  });

  const zoneCenter = await prisma.zone.create({
    data: { name: 'Zona Centro', description: 'Sector centro de Tunja', status: 'ACTIVE' },
  });

  const zoneSouth = await prisma.zone.create({
    data: { name: 'Zona Sur', description: 'Sector sur de Tunja', status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────────
  // 3. CHECKLIST TEMPLATES (RF31)
  // ─────────────────────────────────────────────
  await prisma.checklistTemplate.createMany({
    data: [
      { itemName: 'Frenos',                       required: true,  status: 'ACTIVE' },
      { itemName: 'Llantas',                       required: true,  status: 'ACTIVE' },
      { itemName: 'Luces delanteras',              required: true,  status: 'ACTIVE' },
      { itemName: 'Luces traseras',                required: true,  status: 'ACTIVE' },
      { itemName: 'Cinturones de seguridad',       required: true,  status: 'ACTIVE' },
      { itemName: 'Extintor',                      required: true,  status: 'ACTIVE' },
      { itemName: 'Botiquín de primeros auxilios', required: true,  status: 'ACTIVE' },
      { itemName: 'Retrovisores',                  required: true,  status: 'ACTIVE' },
      { itemName: 'Nivel de combustible',          required: true,  status: 'ACTIVE' },
      { itemName: 'Nivel de aceite',               required: true,  status: 'ACTIVE' },
      { itemName: 'Líquido refrigerante',          required: true,  status: 'ACTIVE' },
      { itemName: 'Líquido de frenos',             required: true,  status: 'ACTIVE' },
    ],
  });

  // ─────────────────────────────────────────────
  // 4. VEHICLE DOCUMENTS
  // ─────────────────────────────────────────────
  const soatDoc1 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'SOAT', documentNumber: 'SOAT-2024-001',
      issueDate: new Date('2024-01-15'), expiryDate: new Date('2025-01-15'),
      fileUrl: 'https://storage.rutasegura.com/docs/soat_001.pdf', status: 'ACTIVE',
    },
  });
  const techDoc1 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'TECHNICAL_INSPECTION', documentNumber: 'TECH-2024-001',
      issueDate: new Date('2024-03-10'), expiryDate: new Date('2026-03-10'),
      fileUrl: 'https://storage.rutasegura.com/docs/tech_001.pdf', status: 'ACTIVE',
    },
  });
  const insuranceDoc1 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'INSURANCE', documentNumber: 'SEG-2024-001',
      issueDate: new Date('2024-01-01'), expiryDate: new Date('2025-01-01'),
      fileUrl: 'https://storage.rutasegura.com/docs/insurance_001.pdf', status: 'ACTIVE',
    },
  });
  const propertyCard1 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'PROPERTY_CARD', documentNumber: 'PROP-2020-001',
      issueDate: new Date('2020-06-20'),
      fileUrl: 'https://storage.rutasegura.com/docs/property_001.pdf', status: 'ACTIVE',
    },
  });
  const soatDoc2 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'SOAT', documentNumber: 'SOAT-2024-002',
      issueDate: new Date('2024-02-01'), expiryDate: new Date('2025-02-01'), status: 'ACTIVE',
    },
  });
  const techDoc2 = await prisma.vehicleDocument.create({
    data: {
      documentType: 'TECHNICAL_INSPECTION', documentNumber: 'TECH-2024-002',
      issueDate: new Date('2024-04-01'), expiryDate: new Date('2026-04-01'), status: 'ACTIVE',
    },
  });

  // ─────────────────────────────────────────────
  // 5. VEHICLES (2 buses de ejemplo)
  // ─────────────────────────────────────────────
  const vehicle1 = await prisma.vehicle.create({
    data: {
      plate: 'ABC-123', passengerCapacity: 10,
      brand: 'Mercedes-Benz', model: 'Sprinter', year: 2020, status: 'ACTIVE',
      soatId: soatDoc1.id, technicalInspectionId: techDoc1.id,
      insuranceId: insuranceDoc1.id, propertyCardId: propertyCard1.id,
    },
  });
  const vehicle2 = await prisma.vehicle.create({
    data: {
      plate: 'XYZ-789', passengerCapacity: 10,
      brand: 'Toyota', model: 'Coaster', year: 2019, status: 'ACTIVE',
      soatId: soatDoc2.id, technicalInspectionId: techDoc2.id,
    },
  });

  // ─────────────────────────────────────────────
  // 6. PERSON DOCUMENTS
  // ─────────────────────────────────────────────
  const driverCedula = await prisma.personDocument.create({
    data: { documentNumber: '1098765432', documentType: 'CEDULA',
      description: 'Cédula conductor', issueDate: new Date('2010-05-15'), status: 'ACTIVE' },
  });
  const driverLicense = await prisma.personDocument.create({
    data: { documentNumber: 'LIC-C2-00123', documentType: 'LICENCIA_CONDUCCION',
      description: 'Licencia categoría C2', issueDate: new Date('2018-08-01'),
      expiryDate: new Date('2028-08-01'),
      fileUrl: 'https://storage.rutasegura.com/docs/licencia_00123.pdf', status: 'ACTIVE' },
  });
  const coordinatorCedula = await prisma.personDocument.create({
    data: { documentNumber: '1020304050', documentType: 'CEDULA',
      description: 'Cédula coordinadora', issueDate: new Date('2008-03-10'), status: 'ACTIVE' },
  });
  const student1Doc = await prisma.personDocument.create({
    data: { documentNumber: 'TI-1234567890', documentType: 'TARJETA_IDENTIDAD',
      description: 'Tarjeta identidad menor', status: 'ACTIVE' },
  });
  const student2Doc = await prisma.personDocument.create({
    data: { documentNumber: 'TI-0987654321', documentType: 'TARJETA_IDENTIDAD',
      description: 'Tarjeta identidad menor', status: 'ACTIVE' },
  });
  const student3Doc = await prisma.personDocument.create({
    data: { documentNumber: 'TI-1122334455', documentType: 'TARJETA_IDENTIDAD',
      description: 'Tarjeta identidad menor', status: 'ACTIVE' },
  });
  const guardian1Doc = await prisma.personDocument.create({
    data: { documentNumber: '5544332211', documentType: 'CEDULA',
      description: 'Cédula acudiente 1', status: 'ACTIVE' },
  });
  const guardian2Doc = await prisma.personDocument.create({
    data: { documentNumber: '6677889900', documentType: 'CEDULA',
      description: 'Cédula acudiente 2', status: 'ACTIVE' },
  });
  const guardian3Doc = await prisma.personDocument.create({
    data: { documentNumber: '7788990011', documentType: 'CEDULA',
      description: 'Cédula acudiente 3', status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────────
  // 7. GUARDIANS (acudientes — sin acceso al sistema)
  // ─────────────────────────────────────────────
  const guardian1 = await prisma.guardian.create({
    data: { documentId: guardian1Doc.id, firstName: 'Carlos', firstLastname: 'Ramírez',
      secondLastname: 'Gómez', phone: '3101234567',
      email: 'carlos.ramirez@email.com', status: 'ACTIVE' },
  });
  const guardian2 = await prisma.guardian.create({
    data: { documentId: guardian2Doc.id, firstName: 'Lucía', firstLastname: 'Torres',
      secondLastname: 'Vargas', phone: '3209876543',
      email: 'lucia.torres@email.com', status: 'ACTIVE' },
  });
  // Acudiente con padres separados — el estudiante tiene dos direcciones
  const guardian3 = await prisma.guardian.create({
    data: { documentId: guardian3Doc.id, firstName: 'Jorge', firstLastname: 'Medina',
      phone: '3114455667', email: 'jorge.medina@email.com', status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────────
  // 8. PERSONS
  // personType: STUDENT | DRIVER | COORDINATOR
  // ─────────────────────────────────────────────
  const driverPerson = await prisma.person.create({
    data: { personType: 'DRIVER', firstName: 'Andrés', middleName: 'Felipe',
      firstLastname: 'Moreno', secondLastname: 'Castro',
      phone: '3001112222', email: 'andres.moreno@rutasegura.com', status: 'ACTIVE' },
  });
  const coordinatorPerson = await prisma.person.create({
    data: { personType: 'COORDINATOR', firstName: 'Laura',
      firstLastname: 'Jiménez', secondLastname: 'Pérez',
      phone: '3153334444', email: 'laura.jimenez@rutasegura.com', status: 'ACTIVE' },
  });

  // Estudiantes zona norte
  const student1 = await prisma.person.create({
    data: { personType: 'STUDENT', guardianId: guardian1.id,
      firstName: 'Sofía', firstLastname: 'Ramírez',
      secondLastname: 'López', status: 'ACTIVE' },
  });
  const student2 = await prisma.person.create({
    data: { personType: 'STUDENT', guardianId: guardian2.id,
      firstName: 'Miguel', firstLastname: 'Torres', status: 'ACTIVE' },
  });
  // Estudiante con dos direcciones (padres separados) — zona norte y zona centro
  const student3 = await prisma.person.create({
    data: { personType: 'STUDENT', guardianId: guardian3.id,
      firstName: 'Valentina', firstLastname: 'Medina',
      secondLastname: 'Ruiz', status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────────
  // 9. PERSON DOCUMENT LINKS
  // ─────────────────────────────────────────────
  await prisma.personDocumentLink.createMany({
    data: [
      { personId: driverPerson.id,      personDocumentId: driverCedula.id,      documentRole: 'CEDULA'            },
      { personId: driverPerson.id,      personDocumentId: driverLicense.id,     documentRole: 'LICENCIA'          },
      { personId: coordinatorPerson.id, personDocumentId: coordinatorCedula.id, documentRole: 'CEDULA'            },
      { personId: student1.id,          personDocumentId: student1Doc.id,       documentRole: 'TARJETA_IDENTIDAD' },
      { personId: student2.id,          personDocumentId: student2Doc.id,       documentRole: 'TARJETA_IDENTIDAD' },
      { personId: student3.id,          personDocumentId: student3Doc.id,       documentRole: 'TARJETA_IDENTIDAD' },
    ],
  });

  // ─────────────────────────────────────────────
  // 10. USERS
  // ─────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const coordinatorUser = await prisma.user.create({
    data: { email: 'coordinador@rutasegura.com', password: hashedPassword,
      personId: coordinatorPerson.id, roleId: roleCoordinator.id,
      status: 'ACTIVE', pickupEnabled: false },
  });
  const driverUser = await prisma.user.create({
    data: { email: 'conductor@rutasegura.com', password: hashedPassword,
      personId: driverPerson.id, roleId: roleDriver.id,
      status: 'ACTIVE', pickupEnabled: true },
  });

  // ─────────────────────────────────────────────
  // 11. ADDRESSES
  // Cada dirección sabe a qué zona pertenece
  // ─────────────────────────────────────────────
  const hqAddress = await prisma.address.create({
    data: { address: 'Calle 20 # 11-32, Tunja (Colegio)',
      latitude: 5.5352889, longitude: -73.3671929, status: 'ACTIVE' },
  });
  const northAddr1 = await prisma.address.create({
    data: { address: 'Calle 63 # 10-45, Tunja — Zona Norte',
      latitude: 5.5601234, longitude: -73.3612345, zoneId: zoneNorth.id, status: 'ACTIVE' },
  });
  const northAddr2 = await prisma.address.create({
    data: { address: 'Carrera 12 # 60-18, Tunja — Zona Norte',
      latitude: 5.5623456, longitude: -73.3598765, zoneId: zoneNorth.id, status: 'ACTIVE' },
  });
  // Dirección principal de Valentina (zona norte — casa papá)
  const student3AddressNorth = await prisma.address.create({
    data: { address: 'Calle 58 # 9-22, Tunja — Zona Norte',
      latitude: 5.5587654, longitude: -73.3621098, zoneId: zoneNorth.id, status: 'ACTIVE' },
  });
  // Dirección secundaria de Valentina (zona centro — casa mamá)
  const student3AddressCenter = await prisma.address.create({
    data: { address: 'Carrera 9 # 22-14, Tunja — Zona Centro',
      latitude: 5.5378901, longitude: -73.3654321, zoneId: zoneCenter.id, status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────────
  // 12. HEADQUARTERS (sede colegio)
  // ─────────────────────────────────────────────
  const hq1 = await prisma.headquarters.create({
    data: { name: 'Colegio Principal Tunja',
      addressId: hqAddress.id, description: 'Sede principal del colegio' },
  });

  // ─────────────────────────────────────────────
  // 13. PERSON ADDRESSES
  // validDays null = aplica todos los días
  // "LUN,MIE,VIE" = solo esos días
  // ─────────────────────────────────────────────
  const personAddr1 = await prisma.personAddress.create({
    data: { personId: student1.id, addressId: northAddr1.id,
      addressType: 'PRINCIPAL', validDays: null },
  });
  const personAddr2 = await prisma.personAddress.create({
    data: { personId: student2.id, addressId: northAddr2.id,
      addressType: 'PRINCIPAL', validDays: null },
  });
  // Valentina: casa del papá lunes, miércoles y viernes (zona norte)
  const personAddr3North = await prisma.personAddress.create({
    data: { personId: student3.id, addressId: student3AddressNorth.id,
      addressType: 'PRINCIPAL', validDays: 'LUN,MIE,VIE' },
  });
  // Valentina: casa de la mamá martes y jueves (zona centro)
  const personAddr3Center = await prisma.personAddress.create({
    data: { personId: student3.id, addressId: student3AddressCenter.id,
      addressType: 'SECONDARY', validDays: 'MAR,JUE' },
  });

  // ─────────────────────────────────────────────
  // 14. ROUTES
  // Una ruta por zona — destinationId apunta al colegio
  // ─────────────────────────────────────────────
  const routeNorth = await prisma.route.create({
    data: {
      name: 'Ruta Zona Norte — Mañana',
      zoneId: zoneNorth.id,
      originDescription: 'Recorrido zona norte de Tunja',
      destinationId: hq1.id,
      startTime: new Date('1970-01-01T06:00:00Z'),
      endTime:   new Date('1970-01-01T07:30:00Z'),
      status: 'ACTIVE',
      vehiclePlate:   vehicle1.plate,
      driverPersonId: driverPerson.id,
    },
  });
  const routeCenter = await prisma.route.create({
    data: {
      name: 'Ruta Zona Centro — Mañana',
      zoneId: zoneCenter.id,
      originDescription: 'Recorrido zona centro de Tunja',
      destinationId: hq1.id,
      startTime: new Date('1970-01-01T06:15:00Z'),
      endTime:   new Date('1970-01-01T07:30:00Z'),
      status: 'ACTIVE',
      vehiclePlate:   vehicle2.plate,
      driverPersonId: driverPerson.id,
    },
  });

  // ─────────────────────────────────────────────
  // 15. STOPS
  // ─────────────────────────────────────────────
  const stopNorth1 = await prisma.stop.create({
    data: { routeId: routeNorth.id, stopOrder: 1,
      description: 'Parada Sofía Ramírez — Calle 63',
      latitude: 5.5601234, longitude: -73.3612345,
      estimatedTime: new Date('1970-01-01T06:10:00Z') },
  });
  const stopNorth2 = await prisma.stop.create({
    data: { routeId: routeNorth.id, stopOrder: 2,
      description: 'Parada Miguel Torres — Carrera 12',
      latitude: 5.5623456, longitude: -73.3598765,
      estimatedTime: new Date('1970-01-01T06:20:00Z') },
  });
  const stopNorth3 = await prisma.stop.create({
    data: { routeId: routeNorth.id, stopOrder: 3,
      description: 'Parada Valentina Medina — Calle 58 (LUN/MIE/VIE)',
      latitude: 5.5587654, longitude: -73.3621098,
      estimatedTime: new Date('1970-01-01T06:30:00Z') },
  });
  await prisma.stop.create({
    data: { routeId: routeNorth.id, stopOrder: 4,
      description: 'Colegio Principal — destino final',
      latitude: 5.5352889, longitude: -73.3671929,
      estimatedTime: new Date('1970-01-01T07:00:00Z') },
  });
  const stopCenter1 = await prisma.stop.create({
    data: { routeId: routeCenter.id, stopOrder: 1,
      description: 'Parada Valentina Medina — Carrera 9 (MAR/JUE)',
      latitude: 5.5378901, longitude: -73.3654321,
      estimatedTime: new Date('1970-01-01T06:20:00Z') },
  });
  await prisma.stop.create({
    data: { routeId: routeCenter.id, stopOrder: 2,
      description: 'Colegio Principal — destino final',
      latitude: 5.5352889, longitude: -73.3671929,
      estimatedTime: new Date('1970-01-01T07:00:00Z') },
  });

  // ─────────────────────────────────────────────
  // 16. ROUTE ASSIGNMENTS
  // Valentina tiene dos asignaciones: una por zona norte y otra por zona centro
  // ─────────────────────────────────────────────
  const assignment1 = await prisma.routeAssignment.create({
    data: { personId: student1.id, routeId: routeNorth.id,
      stopId: stopNorth1.id, personAddressId: personAddr1.id,
      startDate: new Date('2025-01-20'), status: 'ACTIVE' },
  });
  const assignment2 = await prisma.routeAssignment.create({
    data: { personId: student2.id, routeId: routeNorth.id,
      stopId: stopNorth2.id, personAddressId: personAddr2.id,
      startDate: new Date('2025-01-20'), status: 'ACTIVE' },
  });
  // Valentina — ruta norte los días que está en casa del papá
  const assignment3 = await prisma.routeAssignment.create({
    data: { personId: student3.id, routeId: routeNorth.id,
      stopId: stopNorth3.id, personAddressId: personAddr3North.id,
      startDate: new Date('2025-01-20'), status: 'ACTIVE' },
  });
  // Valentina — ruta centro los días que está en casa de la mamá
  const assignment4 = await prisma.routeAssignment.create({
    data: { personId: student3.id, routeId: routeCenter.id,
      stopId: stopCenter1.id, personAddressId: personAddr3Center.id,
      startDate: new Date('2025-01-20'), status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────────
  // 17. ROUTE ASSIGNMENT HEADQUARTERS
  // ─────────────────────────────────────────────
  await prisma.routeAssignmentHeadquarters.createMany({
    data: [
      { routeAssignmentId: assignment1.id, headquartersId: hq1.id },
      { routeAssignmentId: assignment2.id, headquartersId: hq1.id },
      { routeAssignmentId: assignment3.id, headquartersId: hq1.id },
      { routeAssignmentId: assignment4.id, headquartersId: hq1.id },
    ],
  });

  // ─────────────────────────────────────────────
  // 18. TRIPS
  // PENDING_CHECKLIST → ENABLED → IN_PROGRESS → COMPLETED
  // ─────────────────────────────────────────────
  const trip1 = await prisma.trip.create({
    data: { routeId: routeNorth.id, vehiclePlate: vehicle1.plate,
      driverPersonId: driverPerson.id, tripDate: new Date('2025-03-17'),
      status: 'COMPLETED', startedAt: new Date('2025-03-17T06:02:00Z'),
      endedAt: new Date('2025-03-17T07:25:00Z'), observations: 'Viaje sin novedades' },
  });
  const trip2 = await prisma.trip.create({
    data: { routeId: routeNorth.id, vehiclePlate: vehicle1.plate,
      driverPersonId: driverPerson.id, tripDate: new Date('2025-03-18'),
      status: 'IN_PROGRESS', startedAt: new Date('2025-03-18T06:01:00Z') },
  });

  // ─────────────────────────────────────────────
  // 19. CHECKLISTS
  // ─────────────────────────────────────────────
  const checklist1 = await prisma.checklist.create({
    data: { tripId: trip1.id, vehiclePlate: vehicle1.plate,
      reviewedByUserId: driverUser.id, status: 'APPROVED',
      generalObservations: 'Vehículo en perfectas condiciones' },
  });
  const checklist2 = await prisma.checklist.create({
    data: { tripId: trip2.id, vehiclePlate: vehicle1.plate,
      reviewedByUserId: driverUser.id, status: 'APPROVED',
      generalObservations: 'Leve desgaste en llanta delantera derecha' },
  });

  // ─────────────────────────────────────────────
  // 20. CHECKLIST ITEMS
  // ─────────────────────────────────────────────
  const baseItems = [
    { itemName: 'Frenos',                       passed: true },
    { itemName: 'Llantas',                       passed: true },
    { itemName: 'Luces delanteras',              passed: true },
    { itemName: 'Luces traseras',                passed: true },
    { itemName: 'Cinturones de seguridad',       passed: true },
    { itemName: 'Extintor',                      passed: true },
    { itemName: 'Botiquín de primeros auxilios', passed: true },
    { itemName: 'Retrovisores',                  passed: true },
    { itemName: 'Nivel de combustible',          passed: true },
    { itemName: 'Nivel de aceite',               passed: true },
    { itemName: 'Líquido refrigerante',          passed: true },
    { itemName: 'Líquido de frenos',             passed: true },
  ];

  await prisma.checklistItem.createMany({
    data: baseItems.map((item) => ({ checklistId: checklist1.id, ...item })),
  });
  // Viaje 2: llantas en mal estado (índice 1)
  await prisma.checklistItem.createMany({
    data: baseItems.map((item, i) => ({
      checklistId: checklist2.id,
      ...item,
      passed:       i === 1 ? false : item.passed,
      observations: i === 1 ? 'Desgaste visible en llanta delantera derecha' : undefined,
    })),
  });

  // ─────────────────────────────────────────────
  // 21. DOCUMENT ALERTS
  // ─────────────────────────────────────────────
  await prisma.documentAlert.createMany({
    data: [
      { vehicleDocumentId: soatDoc1.id, vehiclePlate: vehicle1.plate,
        alertType: 'EXPIRY_WARNING', message: 'El SOAT del vehículo ABC-123 vence en 15 días',
        documentExpiryDate: new Date('2025-01-15'), daysRemaining: 15, isRead: false },
      { vehicleDocumentId: insuranceDoc1.id, vehiclePlate: vehicle1.plate,
        alertType: 'EXPIRY_WARNING', message: 'El seguro del vehículo ABC-123 vence en 30 días',
        documentExpiryDate: new Date('2025-01-01'), daysRemaining: 30,
        isRead: true, readAt: new Date('2025-03-15T10:00:00Z') },
      { personDocumentId: driverLicense.id, personId: driverPerson.id,
        alertType: 'EXPIRY_INFO', message: 'La licencia de Andrés Moreno vence en 2028',
        documentExpiryDate: new Date('2028-08-01'), daysRemaining: 1231, isRead: false },
    ],
  });

  // ─────────────────────────────────────────────
  // 22. VEHICLE STATUS HISTORY
  // ─────────────────────────────────────────────
  await prisma.vehicleStatusHistory.createMany({
    data: [
      { vehiclePlate: vehicle1.plate, previousStatus: null,          newStatus: 'ACTIVE',      reason: 'Registro inicial', responsibleUser: 'coordinador@rutasegura.com' },
      { vehiclePlate: vehicle2.plate, previousStatus: null,          newStatus: 'ACTIVE',      reason: 'Registro inicial', responsibleUser: 'coordinador@rutasegura.com' },
      { vehiclePlate: vehicle1.plate, previousStatus: 'ACTIVE',      newStatus: 'MAINTENANCE', reason: 'Revisión preventiva programada', responsibleUser: 'coordinador@rutasegura.com', changedAt: new Date('2025-02-10T08:00:00Z') },
      { vehiclePlate: vehicle1.plate, previousStatus: 'MAINTENANCE', newStatus: 'ACTIVE',      reason: 'Mantenimiento completado', responsibleUser: 'coordinador@rutasegura.com', changedAt: new Date('2025-02-12T16:00:00Z') },
    ],
  });

  console.log('✅ Seed completado');
  console.log('   Coordinadora: coordinador@rutasegura.com / password123');
  console.log('   Conductor:    conductor@rutasegura.com   / password123');
}

main()
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
