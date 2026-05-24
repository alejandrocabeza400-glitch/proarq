import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

const adminToken = 'valid-admin-jwt-token';
const clienteToken = 'valid-cliente-jwt-token';

describe('Users CRUD - ADMIN only', () => {
  describe('POST /api/v1/users', () => {
    test('should create a user when ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@proarq.com',
          password: 'SecurePass123!',
          role: 'DIRECTOR_OBRA',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe('newuser@proarq.com');
    });

    test('should return 403 for non-ADMIN roles', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          name: 'Unauthorized',
          email: 'unauth@proarq.com',
          password: 'SecurePass123!',
          role: 'CLIENTE',
        });

      expect(res.status).toBe(403);
    });

    test('should return 401 without auth token', async () => {
      const res = await request(app).post('/api/v1/users').send({
        name: 'No Auth',
        email: 'noauth@proarq.com',
        password: 'SecurePass123!',
        role: 'CLIENTE',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users', () => {
    test('should list users when ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should return 403 for non-ADMIN roles', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });

    test('should support pagination and filters', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ name: 'admin', role: 'ADMIN', page: 1, limit: 5 });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('should return user by id when ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/users/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    test('should return 403 for non-ADMIN roles', async () => {
      const res = await request(app)
        .get('/api/v1/users/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    test('should update user when ADMIN', async () => {
      const res = await request(app)
        .put('/api/v1/users/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name', role: 'GERENTE_OBRA' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    test('should return 403 for non-ADMIN roles', async () => {
      const res = await request(app)
        .put('/api/v1/users/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ name: 'Hack Attempt' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    test('should delete user when ADMIN and return 204', async () => {
      const res = await request(app)
        .delete('/api/v1/users/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    test('should return 403 for non-ADMIN roles', async () => {
      const res = await request(app)
        .delete('/api/v1/users/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.status).toBe(403);
    });
  });
});
