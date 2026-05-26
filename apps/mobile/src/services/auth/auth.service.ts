import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../api/auth.api';
import { authStorage } from '../storage/auth-storage';

export const authService = {
  login: async (payload: { email: string; password: string }) => {
    const response = await authApi.login(payload);
    const { accessToken, refreshToken, user } = response.data;

    await authStorage.setTokens(accessToken, refreshToken);
    useAuthStore.getState().login({ user, accessToken, refreshToken });

    return response.data;
  },

  forgotPassword: async (payload: { email: string }) => {
    const response = await authApi.forgotPassword(payload);
    return response.data;
  },

  resetPassword: async (payload: { token: string; newPassword: string }) => {
    const response = await authApi.resetPassword(payload);
    return response.data;
  },

  logout: async () => {
    await authStorage.clearTokens();
    useAuthStore.getState().logout();
  },
};
