import axios from 'axios';
import Constants from 'expo-constants';

/**
 * Resuelve el host del backend en este orden:
 * 1. `EXPO_PUBLIC_API_BASE_URL` si está definida (build de producción vía eas.json,
 *    o `.env` en local). Se espera CON el sufijo `/api`
 *    (p. ej. `https://myfoodie.up.railway.app/api`); aquí se recorta para quedarnos
 *    solo con el host.
 * 2. Sin esa variable, la IP de la máquina que corre Metro (para probar desde un
 *    móvil físico en la misma Wi-Fi).
 * 3. Último recurso: `localhost` (emulador / web).
 */
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

const BASE_URL = `${getServerHost()}/api`;
// eslint-disable-next-line no-console
console.log(`[apiClient] baseURL resuelta: ${BASE_URL}`);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  // Railway "duerme" el backend tras un rato de inactividad y tarda unos ~20s en
  // despertar con la primera petición. Con 10s de timeout, esa primera petición
  // abortaba con ECONNABORTED antes de que el servidor respondiera, lo que se veía
  // como una pantalla que carga dos veces o que falla/retrocede sin motivo aparente.
  timeout: 30000,
});

let _getToken: () => string | null = () => null;

export const setTokenGetter = (fn: () => string | null) => {
  _getToken = fn;
};

export const getAuthToken = (): string | null => _getToken();

// Se invoca cuando el backend rechaza una petición autenticada con 401 (token
// caducado, inválido o en lista negra tras cerrar sesión). Lo registra authStore
// para limpiar la sesión y que el guard de navegación lleve al login.
let _onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (fn: () => void) => {
  _onUnauthorized = fn;
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
    // eslint-disable-next-line no-console
    console.log('[apiClient] error en', error.config?.method?.toUpperCase(), error.config?.url, {
      code: error.code,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Un 401 en cualquier petición que no sea de /auth (login, registro, validar token)
    // significa que la sesión ya no vale: se avisa para cerrarla y redirigir al login.
    const requestUrl: string = error.config?.url ?? '';
    if (error.response?.status === 401 && !requestUrl.startsWith('/auth/')) {
      _onUnauthorized?.();
    }

    const serverMessage: string | undefined = error.response?.data?.message;
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage));
    }

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('La operación ha tardado demasiado. Inténtalo de nuevo.'));
      }
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
