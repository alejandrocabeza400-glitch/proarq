import { describe, expect, test } from 'bun:test';
import request from 'supertest';
import { app } from '../app';

describe('Swagger Documentation', () => {
  test('GET / should return Swagger UI HTML (status 200)', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
    expect(res.text).toContain('SwaggerUIBundle');
  });

  describe('GET /api/v1/docs.json', () => {
    test('should return 200 with valid OpenAPI 3.0.3 spec', async () => {
      const res = await request(app).get('/api/v1/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info).toBeDefined();
      expect(res.body.info.title).toBeDefined();
      expect(res.body.paths).toBeDefined();
    });

    test('should document all key endpoints', async () => {
      const res = await request(app).get('/api/v1/docs.json');
      expect(res.status).toBe(200);

      const expectedPaths = [
        '/api/v1/health',
        '/api/v1/auth/login',
        '/api/v1/users',
        '/api/v1/insumos',
        '/api/v1/apus',
        '/api/v1/cotizaciones',
        '/api/v1/audit-logs',
        '/api/v1/sincronizar',
      ];

      for (const path of expectedPaths) {
        expect(res.body.paths).toHaveProperty(path);
      }
    });

    test('should include bearerAuth security scheme', async () => {
      const res = await request(app).get('/api/v1/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.components).toBeDefined();
      expect(res.body.components.securitySchemes).toBeDefined();
      expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
      expect(res.body.components.securitySchemes.bearerAuth.type).toBe('http');
      expect(res.body.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
      expect(res.body.components.securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
    });
  });

  test('GET / should return 404 when SWAGGER_ENABLED=false', async () => {
    const originalEnv = process.env.SWAGGER_ENABLED;
    process.env.SWAGGER_ENABLED = 'false';

    try {
      const res = await request(app).get('/');
      expect(res.status).toBe(404);
    } finally {
      process.env.SWAGGER_ENABLED = originalEnv;
    }
  });
});
