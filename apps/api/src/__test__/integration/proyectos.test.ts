import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

const adminToken = 'valid-admin-jwt-token';
const clienteToken = 'valid-cliente-jwt-token';

describe('Proyectos CRUD - ADMIN and GERENTE only', () => {
  describe('POST /api/v1/proyectos', () => {
    test('should create a project when ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/proyectos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'PROJ-TEST-100',
          nombre: 'Proyecto de Prueba Integración',
          descripcion: 'Descripción del proyecto de prueba',
          estado: 'PLANIFICACION',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.codigo).toBe('PROJ-TEST-100');
    });

    test('should return 403 for CLIENTE role', async () => {
      const res = await request(app)
        .post('/api/v1/proyectos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          codigo: 'PROJ-TEST-101',
          nombre: 'Proyecto No Autorizado',
        });

      expect(res.status).toBe(403);
    });

    test('should return 400 when duplicate code', async () => {
      const res = await request(app)
        .post('/api/v1/proyectos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'PROJ-001', // Already seeded in seed.ts
          nombre: 'Proyecto Duplicado',
        });

      expect(res.status).toBe(409); // Zod checks or DB UNIQUE constraint causes 409
    });
  });

  describe('GET /api/v1/proyectos', () => {
    test('should list projects', async () => {
      const res = await request(app)
        .get('/api/v1/proyectos')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/proyectos/:id', () => {
    test('should return project by id', async () => {
      const res = await request(app)
        .get('/api/v1/proyectos/a00e8400-e29b-41d4-a716-446655440005')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.codigo).toBe('PROJ-001');
    });

    test('should return 404 for non-existent project id', async () => {
      const res = await request(app)
        .get('/api/v1/proyectos/f00e8400-e29b-41d4-a716-44665544000f')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/v1/proyectos/:id', () => {
    test('should update project when ADMIN', async () => {
      const res = await request(app)
        .put('/api/v1/proyectos/a00e8400-e29b-41d4-a716-446655440005')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nombre Proyecto Modificado',
          estado: 'EN_EJECUCION',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe('Nombre Proyecto Modificado');
      expect(res.body.data.estado).toBe('EN_EJECUCION');
    });
  });

  describe('DELETE /api/v1/proyectos/:id', () => {
    test('should delete project when ADMIN and return 204', async () => {
      const res = await request(app)
        .delete('/api/v1/proyectos/z00e8400-e29b-41d4-a716-44665544000z')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
