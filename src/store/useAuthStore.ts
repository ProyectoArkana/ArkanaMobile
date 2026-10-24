import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import { apiClient, configureAuth } from '../api/client';

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
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const TOKEN_SERVICE = 'arkana_jwt';
const USER_SERVICE = 'arkana_user';

export const useAuthStore = create<AuthState>((set) => {
  // JWT stateless: guardamos token y usuario en el Keychain y los dejamos en memoria
  const startSession = async (user: User, token: string) => {
    await Keychain.setGenericPassword('token', token, { service: TOKEN_SERVICE });
    await Keychain.setGenericPassword('user', JSON.stringify(user), { service: USER_SERVICE });
    set({ user, token, isAuthenticated: true });
  };

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
      const { data } = await apiClient.post('/auth/login', { email, password });
      await startSession(data.user, data.token);
    },

    // El registro ya devuelve el token: no hace falta un segundo login
    register: async (username, email, password) => {
      const { data } = await apiClient.post('/auth/register', { username, email, password });
      await startSession(data.user, data.token);
    },

    logout: async () => {
      await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
      await Keychain.resetGenericPassword({ service: USER_SERVICE });
      set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: async () => {
      try {
        const tokenCredentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
        const userCredentials = await Keychain.getGenericPassword({ service: USER_SERVICE });

        if (tokenCredentials && userCredentials) {
          set({
            user: JSON.parse(userCredentials.password),
            token: tokenCredentials.password,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      } catch {
        set({ isAuthenticated: false, isLoading: false });
      }
    },
  };
});

// El cliente HTTP lee el token del store (antes lo buscaba en el Keychain sin indicar el
// "service" con el que se había guardado, así que nunca lo encontraba).
configureAuth({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => {
    if (useAuthStore.getState().isAuthenticated) useAuthStore.getState().logout();
  },
});
