import axios from 'axios';
import Constants from 'expo-constants';

const getServerHost = (): string => {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (env) return env.replace(/\/api\/?$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8080`;
    }
  }

  return 'http://localhost:8080';
};

/**
 * Host del backend sin el prefijo /api, para resolver recursos estáticos
 * (p. ej. imágenes servidas desde backend/src/main/resources/static).
 * Usa la misma detección de IP que el cliente HTTP, para que funcione
 * igual da igual la red Wi-Fi en la que esté el dispositivo.
 */
export const getServerBaseUrl = (): string => getServerHost();

export const apiClient = axios.create({
  baseURL: `${getServerHost()}/api`,
  timeout: 10000,
});

let _getToken: () => string | null = () => null;

export const setTokenGetter = (fn: () => string | null) => {
  _getToken = fn;
};

apiClient.interceptors.request.use((config) => {
  const token = _getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage: string | undefined = error.response?.data?.message;
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage));
    }

    if (!error.response) {
      return Promise.reject(new Error('Sin conexión. Comprueba tu red e inténtalo de nuevo.'));
    }

    const status: number = error.response.status;
    const fallback: Record<number, string> = {
      400: 'Los datos enviados no son válidos.',
      401: 'Credenciales incorrectas.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'Recurso no encontrado.',
      409: 'Ya existe una cuenta con esos datos.',
      500: 'Error del servidor. Inténtalo más tarde.',
    };
    return Promise.reject(new Error(fallback[status] ?? 'Algo ha salido mal. Inténtalo de nuevo.'));
  }
);
