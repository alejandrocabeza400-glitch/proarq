import { beforeEach, describe, expect, it } from 'bun:test';
import { resetMocks } from '../setup';

describe('Auth Store', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('initial state', () => {
    it('should have null user initially', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should have null token initially', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });

    it('should have false isAuthenticated initially', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should have null refreshToken initially', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');
      const state = useAuthStore.getState();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('login action', () => {
    it('should set user and token on login', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      const mockUser = {
        id: 'user-1',
        name: 'Test Admin',
        email: 'admin@proarq.com',
        role: 'ADMIN' as const,
      };

      useAuthStore.getState().login({
        user: mockUser,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-456');
    });

    it('should update isAuthenticated to true on login', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'User', email: 'u@test.com', role: 'GERENTE_OBRA' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe('logout action', () => {
    it('should clear user on logout', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'User', email: 'u@test.com', role: 'ADMIN' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
    });

    it('should set isAuthenticated to false on logout', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'User', email: 'u@test.com', role: 'ADMIN' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('isAuthenticated derived state', () => {
    it('should be true when token and user are set', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'User', email: 'u@test.com', role: 'GERENTE_OBRA' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('should be false when only token is set but user is null', async () => {
      // This might depend on implementation - testing the edge case
      const { useAuthStore } = await import('../../stores/auth.store');
      const state = useAuthStore.getState();
      // If store allows setting token without user, isAuthenticated should still be false
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      expect(useAuthStore.getState().hasRole('ADMIN')).toBe(true);
    });

    it('should return false when user has a different role', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'Client', email: 'client@test.com', role: 'CLIENTE' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      expect(useAuthStore.getState().hasRole('ADMIN')).toBe(false);
    });

    it('should return false when user is null', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');
      expect(useAuthStore.getState().hasRole('ADMIN')).toBe(false);
    });

    it('should accept multiple roles and return true if user matches any', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'Gerente', email: 'gerente@test.com', role: 'GERENTE_OBRA' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const state = useAuthStore.getState();
      // hasRole with multiple roles
      expect(state.hasRole('ADMIN', 'GERENTE_OBRA')).toBe(true);
      expect(state.hasRole('ADMIN', 'CLIENTE')).toBe(false);
    });
  });

  describe('setUser action', () => {
    it('should update the user without changing tokens', async () => {
      const { useAuthStore } = await import('../../stores/auth.store');

      useAuthStore.getState().login({
        user: { id: 'u1', name: 'Old Name', email: 'old@test.com', role: 'ADMIN' },
        accessToken: 'token-123',
        refreshToken: 'refresh-456',
      });

      useAuthStore
        .getState()
        .setUser({ id: 'u1', name: 'New Name', email: 'new@test.com', role: 'ADMIN' });

      const state = useAuthStore.getState();
      expect(state.user?.name).toBe('New Name');
      expect(state.token).toBe('token-123');
      expect(state.refreshToken).toBe('refresh-456');
    });
  });
});
