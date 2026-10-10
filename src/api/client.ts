import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { API_BASE_URL } from './config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Recuperamos el token guardado en el Keychain
      const credentials = await Keychain.getGenericPassword();
      if (credentials && credentials.password) {
        config.headers.Authorization = `Bearer ${credentials.password}`;
        console.log('✅ TOKEN ADJUNTADO EXITOSAMENTE AL REQUEST');
      } else {
        console.log('❌ ADVERTENCIA: Keychain no devolvió ningún token válido.');
      }
    } catch (error) {
      console.error('❌ Error al leer el Keychain:', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);