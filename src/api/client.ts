import axios from 'axios';
import { API_BASE_URL } from './config';

// El store de sesión registra aquí cómo obtener el token y qué hacer ante un 401.
// (Así este archivo no importa el store y se evitan dependencias circulares.)
let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export const configureAuth = (handlers: { getToken: () => string | null; onUnauthorized: () => void }) => {
  getToken = handlers.getToken;
  onUnauthorized = handlers.onUnauthorized;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token vencido o inválido en una ruta protegida -> se cierra la sesión.
// (El login/registro también devuelven 401/409 y no deben cerrar nada.)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = String(error?.config?.url ?? '').startsWith('/auth/');
    if (error?.response?.status === 401 && !isAuthRoute) onUnauthorized();
    return Promise.reject(error);
  },
);
