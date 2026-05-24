import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

const adminToken = 'valid-admin-jwt-token';
const gerenteToken = 'valid-gerente-jwt-token';
const clienteToken = 'valid-cliente-jwt-token';

describe('Cotizaciones endpoints', () => {
  describe('POST /api/v1/cotizaciones', () => {
    test('should create cotizacion for ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/cotizaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
          codigo: 'COT-001',
          clienteId: '550e8400-e29b-41d4-a716-446655440000',
          items: [
            { apuId: '770e8400-e29b-41d4-a716-446655440002', cantidad: '10.00' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.codigo).toBe('COT-001');
    });

    test('should create cotizacion for GERENTE_OBRA', async () => {
      const res = await request(app)
        .post('/api/v1/cotizaciones')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({
          projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
          codigo: 'COT-002',
          items: [],
        });

      expect(res.status).toBe(201);
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .post('/api/v1/cotizaciones')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          projectoId: 'a00e8400-e29b-41d4-a716-446655440005',
          codigo: 'COT-003',
          items: [],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/cotizaciones/:id', () => {
    test('should update cotizacion for ADMIN', async () => {
      const res = await request(app)
        .patch('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          estado: 'ENVIADA',
          profitMarginPercent: '15.00',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('ENVIADA');
    });

    test('should return 400 when cotizacion is APROBADA', async () => {
      const res = await request(app)
        .patch('/api/v1/cotizaciones/aprobada-id-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          estado: 'ENVIADA',
          profitMarginPercent: '15.00',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('should return 403 when profit margin < 8%', async () => {
      const res = await request(app)
        .patch('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          estado: 'ENVIADA',
          profitMarginPercent: '7.99',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/cotizaciones', () => {
    test('should list cotizaciones for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });

    test('should support filters', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ estado: 'BORRADOR', projecto_id: 'a00e8400-e29b-41d4-a716-446655440005', page: 1, limit: 10 });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/cotizaciones/:id', () => {
    test('should return cotizacion with items', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/v1/cotizaciones/:id/pdf', () => {
    test('should return PDF for ADMIN (full details)', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004/pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should return PDF for CLIENTE (redacted)', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004/pdf')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should return 200 for all authenticated roles', async () => {
      const roles = [adminToken, gerenteToken, clienteToken];
      for (const token of roles) {
        const res = await request(app)
          .get('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004/pdf')
          .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('POST /api/v1/cotizaciones/:id/branch', () => {
    test('should create a new version of the cotizacion', async () => {
      const res = await request(app)
        .post('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004/branch')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.estado).toBe('BORRADOR');
    });

    test('should return 400 when max 15 versions exceeded', async () => {
      const res = await request(app)
        .post('/api/v1/cotizaciones/maxed-out-id-0000-0000-000000000000/branch')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .post('/api/v1/cotizaciones/990e8400-e29b-41d4-a716-446655440004/branch')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });
});
