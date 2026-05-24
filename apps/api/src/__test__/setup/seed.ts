/**
 * Seed script for integration tests.
 * Run: bun --env-file=../../.env src/__test__/setup/seed.ts
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../infra/adapters/driven/database/schema';

const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST || 'postgres://root:root@localhost:5432/proarq_test';

async function main() {
  const queryClient = postgres(TEST_DATABASE_URL);
  const db = drizzle(queryClient, { schema });

  console.log('Seeding test database...');

  // Clean existing data (order matters for FK constraints)
  await db.delete(schema.cotizacionItems);
  await db.delete(schema.apuInsumos);
  await db.delete(schema.cotizaciones);
  await db.delete(schema.apus);
  await db.delete(schema.insumosMaestro);
  await db.delete(schema.auditLogs);
  await db.delete(schema.users);

  // Seed users
  const adminPasswordHash = await Bun.password.hash('valid-password');
  const userPasswordHash = await Bun.password.hash('user-password');

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
      id: 'a00e8400-e29b-41d4-a716-446655440003',
      name: 'User for Forgot Password',
      email: 'user@proarq.com',
      passwordHash: userPasswordHash,
      role: 'CLIENTE',
      // No pre-set token — the forgot-password test generates its own
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    {
      id: 'b00e8400-e29b-41d4-a716-446655440009',
      name: 'User for Reset Password',
      email: 'resetuser@proarq.com',
      passwordHash: userPasswordHash,
      role: 'CLIENTE',
      // Known reset token for reset-password tests (SHA-256 of 'valid-reset-token')
      resetTokenHash: '79902197833df66c53a7e9a88601f58cb91f4ec72bd113b8b5d686e6ca1dc3bc',
      resetTokenExpiresAt: new Date(Date.now() + 3600_000),
    },
  ]);

  // Seed insumos (use codigos that won't conflict with test CREATE operations)
  await db.insert(schema.insumosMaestro).values([
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      codigo: 'SEED-CEM-001',
      nombre: 'Cemento Portland Tipo I',
      unidad: 'KG',
      costBase: '25.50',
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
    },
  ]);

  // Seed APUs (use codigos that won't conflict with test CREATE operations)
  await db.insert(schema.apus).values([
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      codigo: 'SEED-APU-001',
      nombre: 'Muro de Ladrillo',
      tipo: 'Estructuras',
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
    },
  ]);

  // Seed APU insumos
  await db.insert(schema.apuInsumos).values([
    {
      id: '880e8400-e29b-41d4-a716-446655440003',
      apuId: '770e8400-e29b-41d4-a716-446655440002',
      insumoId: '660e8400-e29b-41d4-a716-446655440001',
      rendimiento: '2.5',
      desperdicio: '5.00',
      unitPriceSnapshot: '25.50',
    },
  ]);

  // Seed cotizaciones (use codigos that won't conflict with test CREATE operations)
  await db.insert(schema.cotizaciones).values([
    {
      id: '990e8400-e29b-41d4-a716-446655440004',
      projectoId: 'z00e8400-e29b-41d4-a716-44665544000z',
      codigo: 'SEED-COT-001',
      version: 1,
      estado: 'BORRADOR',
      clienteId: '550e8400-e29b-41d4-a716-446655440000',
      totalCostDirect: '1000.0000',
      factorAPercentage: '10.00',
      factorBPercentage: '5.00',
      profitMarginPercent: '15.00',
      totalAmount: '1300.0000',
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
    },
    {
      id: 'aprobada-id-0000-0000-000000000000',
      projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
      codigo: 'COT-APROBADA',
      version: 1,
      estado: 'APROBADA',
      clienteId: null,
      totalCostDirect: '2000.0000',
      factorAPercentage: '10.00',
      factorBPercentage: '5.00',
      profitMarginPercent: '15.00',
      totalAmount: '2600.0000',
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
    },
    {
      id: 'maxed-out-id-0000-0000-000000000000',
      projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
      codigo: 'COT-MAXED',
      version: 15,
      estado: 'BORRADOR',
      clienteId: null,
      totalCostDirect: '500.0000',
      factorAPercentage: '10.00',
      factorBPercentage: '5.00',
      profitMarginPercent: '15.00',
      totalAmount: '650.0000',
      createdBy: '550e8400-e29b-41d4-a716-446655440000',
    },
  ]);

  // Add 12 additional cotizaciones to the same project so countVersionsByProject reaches 15
  const extraCotData = Array.from({ length: 12 }, (_, i) => ({
    id: `extra-cot-${String(i + 1).padStart(3, '0')}-0000-0000-000000000000`,
    projectoId: 'a00e8400-e29b-41d4-a716-446655440005' as const,
    codigo: `COT-EXTRA-${String(i + 1).padStart(3, '0')}`,
    version: i + 1,
    estado: 'REEMPLAZADA' as const,
    clienteId: null as string | null,
    totalCostDirect: '100.0000',
    factorAPercentage: '10.00',
    factorBPercentage: '5.00',
    profitMarginPercent: '15.00',
    totalAmount: '130.0000',
    createdBy: '550e8400-e29b-41d4-a716-446655440000' as const,
  }));
  for (const data of extraCotData) {
    await db.insert(schema.cotizaciones).values(data);
  }

  // Seed cotizacion items
  await db.insert(schema.cotizacionItems).values([
    {
      id: 'bba0e8400-e29b-41d4-a716-446655440006',
      cotizacionId: '990e8400-e29b-41d4-a716-446655440004',
      apuId: '770e8400-e29b-41d4-a716-446655440002',
      cantidad: '10.0000',
      calculatedCostDirect: '255.0000',
    },
    {
      id: 'bba0e8400-e29b-41d4-a716-446655440007',
      cotizacionId: 'aprobada-id-0000-0000-000000000000',
      apuId: '770e8400-e29b-41d4-a716-446655440002',
      cantidad: '5.0000',
      calculatedCostDirect: '127.5000',
    },
    {
      id: 'bba0e8400-e29b-41d4-a716-446655440008',
      cotizacionId: 'maxed-out-id-0000-0000-000000000000',
      apuId: '770e8400-e29b-41d4-a716-446655440002',
      cantidad: '2.0000',
      calculatedCostDirect: '51.0000',
    },
  ]);

  console.log('Seed complete!');
  await queryClient.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
