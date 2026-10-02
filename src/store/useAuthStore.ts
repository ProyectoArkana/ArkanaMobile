import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, token } = response.data;

    // Guardar token de forma segura en el almacenamiento cifrado del celular
    await Keychain.setGenericPassword('jwt_token', token);

    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await Keychain.resetGenericPassword();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        set({ token: credentials.password, isAuthenticated: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));