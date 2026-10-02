import axios from 'axios';
import * as Keychain from 'react-native-keychain';

const API_BASE_URL = 'http://192.168.100.65:3000/api';

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
      // Intentamos recuperar las credenciales guardadas en el Keychain
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
  (error) => Promise.reject(error)
);