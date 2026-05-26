export const authStorage = {
  getAccessToken: async (): Promise<string | null> => {
    try {
      return sessionStorage.getItem('accessToken');
    } catch {
      return null;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return sessionStorage.getItem('refreshToken');
    } catch {
      return null;
    }
  },

  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    try {
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', refreshToken);
    } catch {
      // Storage not available
    }
  },

  clearTokens: async (): Promise<void> => {
    try {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    } catch {
      // Storage not available
    }
  },
};
