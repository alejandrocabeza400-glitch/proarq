import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../../app';

describe('POST /api/v1/auth/login', () => {
  test('should return 200 with tokens when credentials are valid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@proarq.com', password: 'valid-password' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@proarq.com');
  });

  test('should return 401 when email does not exist', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'any-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('should return 401 when password is wrong', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@proarq.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('should return 400 when payload is invalid', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/forgot-password', () => {
  test('should return 200 for existing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'user@proarq.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('should return 200 for non-existing email (security)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nonexistent@test.com' });

    // Security: always return 200 to prevent email enumeration
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/reset-password', () => {
  test('should return 200 with valid token and password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'valid-reset-token', newPassword: 'NewSecurePass123!' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  test('should return 400 with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'invalid-token', newPassword: 'NewSecurePass123!' });

    expect(res.status).toBe(400);
  });

  test('should return 400 with weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'valid-reset-token', newPassword: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  test('should return 200 with new tokens when refresh token is valid', async () => {
    // 1. Login to get a valid refresh token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@proarq.com', password: 'valid-password' });

    expect(loginRes.status).toBe(200);
    const refreshToken = loginRes.body.data.refreshToken;
    expect(refreshToken).toBeDefined();

    // 2. Refresh the token
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@proarq.com');
  });

  test('should return 401 with invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token-string' });

    expect(res.status).toBe(401);
  });

  test('should return 400 when refreshToken payload is missing', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});

    expect(res.status).toBe(400);
  });
});
