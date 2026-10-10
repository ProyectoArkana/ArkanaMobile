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

    // Guardamos el token en el Keychain y guardamos el usuario en JSON dentro del password o almacenamiento
    await Keychain.setGenericPassword(email, token, {
      service: 'arkana_jwt',
    });
    
    // Opcional: también puedes guardar el usuario en AsyncStorage si prefieres, 
    // pero para el token aseguramos el servicio:
    await Keychain.setGenericPassword('user_session', JSON.stringify(user), {
      service: 'arkana_user',
    });

    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await Keychain.resetGenericPassword({ service: 'arkana_jwt' });
    await Keychain.resetGenericPassword({ service: 'arkana_user' });
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const tokenCredentials = await Keychain.getGenericPassword({ service: 'arkana_jwt' });
      const userCredentials = await Keychain.getGenericPassword({ service: 'arkana_user' });

      if (tokenCredentials && userCredentials) {
        const token = tokenCredentials.password;
        const user = JSON.parse(userCredentials.password);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.log('Error al verificar autenticación:', error);
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));