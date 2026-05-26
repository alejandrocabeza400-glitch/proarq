import client from './client';

interface UserDto {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: UserDto;
  };
}

interface ForgotPasswordResponse {
  data: {
    message: string;
  };
}

interface ResetPasswordResponse {
  data: {
    message: string;
  };
}

interface RefreshResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user?: UserDto;
  };
}

export const authApi = {
  login: async (payload: { email: string; password: string }): Promise<LoginResponse> => {
    const { data } = await client.post('/auth/login', payload);
    return data;
  },

  forgotPassword: async (payload: { email: string }): Promise<ForgotPasswordResponse> => {
    const { data } = await client.post('/auth/forgot-password', payload);
    return data;
  },

  resetPassword: async (payload: {
    token: string;
    newPassword: string;
  }): Promise<ResetPasswordResponse> => {
    const { data } = await client.post('/auth/reset-password', payload);
    return data;
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const { data } = await client.post('/auth/refresh', { refreshToken });
    return data;
  },
};
