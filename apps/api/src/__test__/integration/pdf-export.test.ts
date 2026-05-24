import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

const adminToken = 'valid-admin-jwt-token';
const gerenteToken = 'valid-gerente-jwt-token';
const clienteToken = 'valid-cliente-jwt-token';

describe('PDF Export Endpoints', () => {
  describe('GET /api/v1/insumos/pdf', () => {
    test('should export insumos PDF for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/insumos/pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should allow GERENTE_OBRA to export insumos PDF', async () => {
      const res = await request(app)
        .get('/api/v1/insumos/pdf')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should return 403 for CLIENTE on insumos PDF export', async () => {
      const res = await request(app)
        .get('/api/v1/insumos/pdf')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/apus/pdf', () => {
    test('should export APUs PDF for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/apus/pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should return 403 for CLIENTE on APUs PDF export', async () => {
      const res = await request(app)
        .get('/api/v1/apus/pdf')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/cotizaciones/pdf', () => {
    test('should export cotizaciones PDF for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones/pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should return 403 for CLIENTE on cotizaciones list PDF export', async () => {
      const res = await request(app)
        .get('/api/v1/cotizaciones/pdf')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/proyectos/pdf', () => {
    test('should export proyectos PDF for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/proyectos/pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should export proyectos PDF for CLIENTE (authorized role for projects)', async () => {
      const res = await request(app)
        .get('/api/v1/proyectos/pdf')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('GET /api/v1/users/pdf', () => {
    test('should export users PDF for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/users/pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should return 403 for CLIENTE on users PDF export', async () => {
      const res = await request(app)
        .get('/api/v1/users/pdf')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/audit-logs/pdf', () => {
    test('should export audit-logs PDF for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs/pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
    });

    test('should return 403 for CLIENTE on audit-logs PDF export', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs/pdf')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });
});
