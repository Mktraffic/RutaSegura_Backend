import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

/**
 * Script IDEMPOTENTE (re-ejecutable, no borra datos).
 *
 * Habilita el acceso al sistema para un acudiente sobre los datos ya
 * existentes:
 *   1. Garantiza que exista el rol GUARDIAN.
 *   2. Toma un acudiente (por email, o el primero si no se encuentra).
 *   3. Le crea/reutiliza una persona de login (personType = GUARDIAN) y
 *      la vincula con Guardian.personId.
 *   4. Crea/actualiza un usuario con rol GUARDIAN para iniciar sesión.
 *
 * Configurable con variables de entorno (opcional):
 *   GUARDIAN_SOURCE_EMAIL  email del acudiente a habilitar
 *   GUARDIAN_LOGIN_EMAIL   email de login a crear (default acudiente@rutasegura.com)
 *   GUARDIAN_LOGIN_PASSWORD contraseña (default password123)
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SOURCE_EMAIL =
  process.env.GUARDIAN_SOURCE_EMAIL ?? 'carlos.ramirez@email.com';
const LOGIN_EMAIL =
  process.env.GUARDIAN_LOGIN_EMAIL ?? 'acudiente@rutasegura.com';
const LOGIN_PASSWORD = process.env.GUARDIAN_LOGIN_PASSWORD ?? 'password123';

async function main() {
  console.log('Habilitando acceso de acudiente (idempotente)...');

  // 1. Rol GUARDIAN (reutiliza cualquier variante de mayúsculas existente).
  let guardianRole = await prisma.role.findFirst({
    where: { name: { equals: 'GUARDIAN', mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (!guardianRole) {
    guardianRole = await prisma.role.create({
      data: { name: 'GUARDIAN' },
      select: { id: true, name: true },
    });
    console.log(`  ✓ Rol creado: ${guardianRole.name} (id ${guardianRole.id})`);
  } else {
    console.log(
      `  • Rol ya existe: ${guardianRole.name} (id ${guardianRole.id})`,
    );
  }

  // 2. Acudiente a habilitar.
  const guardian =
    (await prisma.guardian.findFirst({
      where: { email: { equals: SOURCE_EMAIL, mode: 'insensitive' } },
    })) ?? (await prisma.guardian.findFirst({ orderBy: { id: 'asc' } }));

  if (!guardian) {
    throw new Error(
      'No hay ningún acudiente (Guardian) en la base de datos para habilitar.',
    );
  }
  console.log(
    `  • Acudiente objetivo: ${guardian.firstName} ${guardian.firstLastname} (id ${guardian.id})`,
  );

  // 3. Persona de login (personType = GUARDIAN): reutiliza la vinculada si ya
  //    existe, si no la crea.
  let loginPersonId = guardian.personId ?? null;
  if (loginPersonId) {
    const existing = await prisma.person.findUnique({
      where: { id: loginPersonId },
      select: { id: true },
    });
    if (!existing) loginPersonId = null;
  }

  if (!loginPersonId) {
    const loginPerson = await prisma.person.create({
      data: {
        personType: 'GUARDIAN',
        firstName: guardian.firstName,
        middleName: guardian.middleName,
        firstLastname: guardian.firstLastname,
        secondLastname: guardian.secondLastname,
        phone: guardian.phone,
        email: guardian.email,
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    loginPersonId = loginPerson.id;
    console.log(`  ✓ Persona de login creada (id ${loginPersonId})`);
  } else {
    console.log(`  • Persona de login reutilizada (id ${loginPersonId})`);
  }

  // Vincula Guardian -> Person de login.
  await prisma.guardian.update({
    where: { id: guardian.id },
    data: { personId: loginPersonId },
  });

  // 4. Usuario de login (upsert por email).
  const hashedPassword = await bcrypt.hash(LOGIN_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: LOGIN_EMAIL },
    update: {
      personId: loginPersonId,
      roleId: guardianRole.id,
      status: 'ACTIVE',
    },
    create: {
      email: LOGIN_EMAIL,
      password: hashedPassword,
      personId: loginPersonId,
      roleId: guardianRole.id,
      status: 'ACTIVE',
      pickupEnabled: false,
    },
    select: { id: true },
  });

  console.log('✅ Acceso de acudiente habilitado');
  console.log(`   Usuario: ${LOGIN_EMAIL} / ${LOGIN_PASSWORD} (user id ${user.id})`);
  console.log('   Verás las rutas de los estudiantes asociados a ese acudiente.');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
