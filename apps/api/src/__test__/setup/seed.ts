/**
 * Seed script for integration tests.
 * Run: bun --env-file=../../.env src/__test__/setup/seed.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../infra/adapters/driven/database/schema';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST || 'postgres://root:root@localhost:5432/proarq_test';

async function main() {
  const queryClient = postgres(TEST_DATABASE_URL);
  const db = drizzle(queryClient, { schema });

  console.log('Cleaning existing data...');
  // Clean existing data (order matters for FK constraints)
  await db.delete(schema.auditLogs);
  await db.delete(schema.cotizacionItems);
  await db.delete(schema.apuInsumos);
  await db.delete(schema.cotizaciones);
  await db.delete(schema.proyectos);
  await db.delete(schema.apus);
  await db.delete(schema.insumosMaestro);
  await db.delete(schema.users);

  // Use a real hash for the seed passwords
  const adminPasswordHash = await Bun.password.hash('valid-password');
  const userPasswordHash = await Bun.password.hash('user-password');

  console.log('Seeding users only...');

  await db.insert(schema.users).values([
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Admin User',
      email: 'admin@proarq.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Cliente User',
      email: 'cliente@proarq.com',
      passwordHash: userPasswordHash,
      role: 'CLIENTE',
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      name: 'Gerente User',
      email: 'gerente@proarq.com',
      passwordHash: userPasswordHash,
      role: 'GERENTE_OBRA',
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440003',
      name: 'Director User',
      email: 'director@proarq.com',
      passwordHash: userPasswordHash,
      role: 'DIRECTOR_OBRA',
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      id: 'a00e8400-e29b-41d4-a716-446655440003',
      name: 'User for Forgot Password',
      email: 'user@proarq.com',
      passwordHash: userPasswordHash,
      role: 'CLIENTE',
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      id: 'b00e8400-e29b-41d4-a716-446655440009',
      name: 'User for Reset Password',
      email: 'resetuser@proarq.com',
      passwordHash: userPasswordHash,
      role: 'CLIENTE',
      resetTokenHash: '79902197833df66c53a7e9a88601f58cb91f4ec72bd113b8b5d686e6ca1dc3bc',
      resetTokenExpiresAt: new Date(Date.now() + 3600_000),
    },
  ]);

  console.log('Seed completed: only users created.');
  await queryClient.end();
}

main().catch((err) => {
  console.error("Seeding error details:", err);
  process.exit(1);
});
