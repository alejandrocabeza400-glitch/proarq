import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { resetMocks } from '../setup';

describe('Auth Service', () => {
  beforeEach(() => {
    resetMocks();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should call POST /auth/login with email and password', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');

      const mockResponse = {
        data: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          user: { id: 'u1', name: 'Admin', email: 'admin@proarq.com', role: 'ADMIN' },
        },
      };

      vi.spyOn(authApi, 'login').mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'admin@proarq.com',
        password: 'secret123',
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'admin@proarq.com',
        password: 'secret123',
      });

      expect(result).toEqual(mockResponse.data);
    });

    it('should store tokens in auth storage on successful login', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');
      const { authStorage } = await import('../../services/storage/auth-storage');

      const mockResponse = {
        data: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          user: { id: 'u1', name: 'Admin', email: 'admin@proarq.com', role: 'ADMIN' },
        },
      };

      vi.spyOn(authApi, 'login').mockResolvedValue(mockResponse);

      await authService.login({
        email: 'admin@proarq.com',
        password: 'secret123',
      });

      const storedToken = await authStorage.getAccessToken();
      expect(storedToken).toBe('access-token-123');
    });

    it('should update auth store with user data on successful login', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');
      const { useAuthStore } = await import('../../stores/auth.store');

      const mockUser = {
        id: 'u1',
        name: 'Admin',
        email: 'admin@proarq.com',
        role: 'ADMIN' as const,
      };
      const mockResponse = {
        data: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          user: mockUser,
        },
      };

      vi.spyOn(authApi, 'login').mockResolvedValue(mockResponse);

      await authService.login({
        email: 'admin@proarq.com',
        password: 'secret123',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should throw on invalid credentials', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');

      const error = { response: { status: 401, data: { error: 'Invalid email or password' } } };
      vi.spyOn(authApi, 'login').mockRejectedValue(error);

      await expect(
        authService.login({ email: 'wrong@test.com', password: 'wrong' }),
      ).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should call POST /auth/forgot-password with email', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');

      vi.spyOn(authApi, 'forgotPassword').mockResolvedValue({
        data: { message: 'Si el correo existe, recibirás un código de verificación' },
      });

      await authService.forgotPassword({ email: 'user@proarq.com' });

      expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'user@proarq.com' });
    });

    it('should return success message on valid email', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');

      const message = 'Si el correo existe, recibirás un código de verificación';
      vi.spyOn(authApi, 'forgotPassword').mockResolvedValue({
        data: { message },
      });

      const result = await authService.forgotPassword({ email: 'user@proarq.com' });
      expect(result.message).toBe(message);
    });
  });

  describe('resetPassword', () => {
    it('should call POST /auth/reset-password with token and new password', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');

      vi.spyOn(authApi, 'resetPassword').mockResolvedValue({
        data: { message: 'Contraseña restablecida exitosamente' },
      });

      await authService.resetPassword({
        token: 'reset-code-123',
        newPassword: 'NewSecurePass1',
      });

      expect(authApi.resetPassword).toHaveBeenCalledWith({
        token: 'reset-code-123',
        newPassword: 'NewSecurePass1',
      });
    });

    it('should throw on invalid or expired token', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authApi } = await import('../../services/api/auth.api');

      vi.spyOn(authApi, 'resetPassword').mockRejectedValue({
        response: { status: 400, data: { error: 'Invalid or expired reset token' } },
      });

      await expect(
        authService.resetPassword({ token: 'bad-token', newPassword: 'NewPass123' }),
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear auth storage and reset store on logout', async () => {
      const { authService } = await import('../../services/auth/auth.service');
      const { authStorage } = await import('../../services/storage/auth-storage');
      const { useAuthStore } = await import('../../stores/auth.store');

      // First login
      await authStorage.setTokens('token', 'refresh');
      useAuthStore.getState().login({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      // Then logout
      await authService.logout();

      const token = await authStorage.getAccessToken();
      expect(token).toBeNull();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
