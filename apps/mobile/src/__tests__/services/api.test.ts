import { beforeEach, describe, expect, it } from 'bun:test';
import { resetMocks } from '../setup';

describe('API Client', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Axios Instance', () => {
    it('should create an axios instance with correct baseURL', async () => {
      const { default: client } = await import('../../services/api/client');
      const expectedBaseURL =
        process.env.EXPO_PUBLIC_API_URL ||
        `http://localhost:${process.env.EXPO_PUBLIC_PORT || process.env.PORT || '8000'}/api/v1`;
      expect(client.defaults.baseURL).toBe(expectedBaseURL);
    });

    it('should set default headers', async () => {
      const { default: client } = await import('../../services/api/client');
      expect(client.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should set timeout from config', async () => {
      const { default: client } = await import('../../services/api/client');
      expect(client.defaults.timeout).toBeGreaterThan(0);
    });
  });

  describe('JWT Interceptor', () => {
    it('should attach Bearer token when token exists', async () => {
      const { default: client } = await import('../../services/api/client');
      const { authStorage } = await import('../../services/storage/auth-storage');
      await authStorage.setTokens('test-token', 'refresh-token');

      const requestInterceptor = client.interceptors.request.handlers[0];
      const config = { headers: {} };
      const result = await requestInterceptor.fulfilled(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not attach token when no token exists', async () => {
      const { default: client } = await import('../../services/api/client');
      const requestInterceptor = client.interceptors.request.handlers[0];
      const config = { headers: {} };
      const result = await requestInterceptor.fulfilled(config);
      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
