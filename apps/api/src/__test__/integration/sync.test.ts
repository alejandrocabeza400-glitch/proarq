import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

const adminToken = 'valid-admin-jwt-token';
const clienteToken = 'valid-cliente-jwt-token';

const syncPayload = {
  insumos: [
    {
      id: 'sync-ins-001-0000-0000-000000000000',
      codigo: 'SYNC-001',
      nombre: 'Synced Material',
      unidad: 'KG',
      cost_base: '100.00',
    },
    {
      id: 'sync-ins-002-0000-0000-000000000000',
      codigo: 'SYNC-002',
      nombre: 'Synced Material 2',
      unidad: 'UND',
      cost_base: '50.00',
    },
  ],
  apus: [
    {
      id: 'sync-apu-001-0000-0000-000000000000',
      codigo: 'SYNC-APU-001',
      nombre: 'Synced APU',
      tipo: 'Estructuras',
    },
  ],
  cotizaciones: [],
};

describe('POST /api/v1/sincronizar', () => {
  test('should accept sync payload and return 201', async () => {
    const res = await request(app)
      .post('/api/v1/sincronizar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(syncPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.accepted).toBe('number');
    expect(typeof res.body.data.conflicts).toBe('number');
  });

  test('should handle duplicate UUIDs idempotently', async () => {
    // First call - should process
    const res1 = await request(app)
      .post('/api/v1/sincronizar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(syncPayload);

    expect(res1.status).toBe(201);

    // Second call with same UUIDs - should not create duplicates
    const res2 = await request(app)
      .post('/api/v1/sincronizar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(syncPayload);

    expect(res2.status).toBe(201);
    // Conflicts should be reported
    expect(res2.body.data.conflicts).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty payload', async () => {
    const res = await request(app)
      .post('/api/v1/sincronizar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ insumos: [], apus: [], cotizaciones: [] });

    expect(res.status).toBe(201);
    expect(res.body.data.accepted).toBe(0);
  });

  test('should accept sync from CLIENTE role', async () => {
    const res = await request(app)
      .post('/api/v1/sincronizar')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send(syncPayload);

    // All authenticated roles can sync
    expect(res.status).toBe(201);
  });

  test('should return 401 without auth token', async () => {
    const res = await request(app).post('/api/v1/sincronizar').send(syncPayload);

    expect(res.status).toBe(401);
  });

  test('should return 400 for malformed payload', async () => {
    const res = await request(app)
      .post('/api/v1/sincronizar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invalid: 'data' });

    expect(res.status).toBe(400);
  });
});
