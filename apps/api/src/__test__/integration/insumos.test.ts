import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

const adminToken = 'valid-admin-jwt-token';
const gerenteToken = 'valid-gerente-jwt-token';
const clienteToken = 'valid-cliente-jwt-token';

describe('Insumos endpoints', () => {
  describe('POST /api/v1/insumos', () => {
    test('should create insumo when ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/insumos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'CEM-001',
          nombre: 'Cemento Portland Tipo I',
          unidad: 'KG',
          costBase: '25.50',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.codigo).toBe('CEM-001');
    });

    test('should return 403 for non-ADMIN roles', async () => {
      const res = await request(app)
        .post('/api/v1/insumos')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({
          codigo: 'MAT-001',
          nombre: 'Material Test',
          unidad: 'UND',
          costBase: '10.00',
        });

      expect(res.status).toBe(403);
    });

    test('should return 400 for invalid unidad', async () => {
      const res = await request(app)
        .post('/api/v1/insumos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'INV-001',
          nombre: 'Invalid Unit',
          unidad: 'LITROS',
          costBase: '10.00',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/insumos', () => {
    test('should list insumos for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/insumos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    test('should list insumos for GERENTE_OBRA', async () => {
      const res = await request(app)
        .get('/api/v1/insumos')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(200);
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .get('/api/v1/insumos')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });

    test('should support pagination and filters', async () => {
      const res = await request(app)
        .get('/api/v1/insumos')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ codigo: 'CEM', unidad: 'KG', page: 1, limit: 10 });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/insumos/:id', () => {
    test('should return insumo by id for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/insumos/660e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    test('should return 403 for CLIENTE', async () => {
      const res = await request(app)
        .get('/api/v1/insumos/660e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/insumos/:id', () => {
    test('should update insumo when ADMIN', async () => {
      const res = await request(app)
        .put('/api/v1/insumos/660e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Cemento Modificado', costBase: '30.00' });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe('Cemento Modificado');
    });

    test('should return 403 for GERENTE_OBRA', async () => {
      const res = await request(app)
        .put('/api/v1/insumos/660e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ costBase: '35.00' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/insumos/:id', () => {
    test('should delete insumo when ADMIN', async () => {
      const res = await request(app)
        .delete('/api/v1/insumos/660e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    test('should return 403 for GERENTE_OBRA', async () => {
      const res = await request(app)
        .delete('/api/v1/insumos/660e8400-e29b-41d4-a716-446655440001')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/insumos/bulk-upload', () => {
    test('should return 201 for valid CSV upload', async () => {
      const res = await request(app)
        .post('/api/v1/insumos/bulk-upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach(
          'file',
          Buffer.from(
            'codigo,nombre,unidad,cost_base\nMAT-001,Material 1,KG,100.00\nMAT-002,Material 2,UND,50.00',
          ),
          'insumos.csv',
        );

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
    });

    test('should return 403 for non-ADMIN roles on bulk upload', async () => {
      const res = await request(app)
        .post('/api/v1/insumos/bulk-upload')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(403);
    });
  });
});
