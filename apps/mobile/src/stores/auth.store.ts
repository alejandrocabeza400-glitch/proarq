import { create } from 'zustand';
import { registerResetStore } from './reset-store';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LoginPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  setUser: (user: User) => void;
}

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  login: (payload: LoginPayload) => {
    set({
      user: payload.user,
      token: payload.accessToken,
      refreshToken: payload.refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hasRole: (...roles: string[]) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },

  setUser: (user: User) => {
    set({ user });
  },
}));

// Register for global reset
registerResetStore(() => useAuthStore.setState(initialState));
