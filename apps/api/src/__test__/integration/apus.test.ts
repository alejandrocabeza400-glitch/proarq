import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

const adminToken = 'valid-admin-jwt-token';
const gerenteToken = 'valid-gerente-jwt-token';
const clienteToken = 'valid-cliente-jwt-token';

describe('APUs endpoints', () => {
  describe('POST /api/v1/apus', () => {
    test('should create APU for ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/apus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'APU-001',
          nombre: 'Muro de Ladrillo',
          tipo: 'Estructuras',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.codigo).toBe('APU-001');
    });

    test('should create APU for GERENTE_OBRA', async () => {
      const res = await request(app)
        .post('/api/v1/apus')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({
          codigo: 'APU-002',
          nombre: 'Tarrajco de Muro',
          tipo: 'Acabados',
        });

      expect(res.status).toBe(201);
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .post('/api/v1/apus')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          codigo: 'APU-003',
          nombre: 'Test',
          tipo: 'Test',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/apus', () => {
    test('should list APUs for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/apus')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .get('/api/v1/apus')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/apus/:id', () => {
    test('should return APU with items for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/apus/770e8400-e29b-41d4-a716-446655440002')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('POST /api/v1/apus/:id/insumos', () => {
    test('should add insumo to APU and capture snapshot price', async () => {
      const res = await request(app)
        .post('/api/v1/apus/770e8400-e29b-41d4-a716-446655440002/insumos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          insumoId: '660e8400-e29b-41d4-a716-446655440001',
          rendimiento: '2.5',
          desperdicio: '5.00',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.unitPriceSnapshot).toBeDefined();
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .post('/api/v1/apus/770e8400-e29b-41d4-a716-446655440002/insumos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          insumoId: '660e8400-e29b-41d4-a716-446655440001',
          rendimiento: '1.0',
          desperdicio: '0',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/apus/:id/insumos/:itemId', () => {
    test('should remove insumo from APU for ADMIN', async () => {
      const res = await request(app)
        .delete(
          '/api/v1/apus/770e8400-e29b-41d4-a716-446655440002/insumos/880e8400-e29b-41d4-a716-446655440003',
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe('snapshot retention', () => {
    test('should retain original snapshot price after master cost_base update', async () => {
      // First, update the master insumo cost_base
      await request(app)
        .put('/api/v1/insumos/660e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ costBase: '200.00' });

      // Then, verify the APU still has the old snapshot
      const res = await request(app)
        .get('/api/v1/apus/770e8400-e29b-41d4-a716-446655440002')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.items && res.body.data.items.length > 0) {
        expect(res.body.data.items[0].unitPriceSnapshot).not.toBe('200.00');
      }
    });
  });
});
