import { getServerBaseUrl } from '@/services/apiClient';

/**
 * Resuelve la URL final de una imagen de receta. Admite tres formatos:
 * - URLs absolutas (http/https): se devuelven tal cual.
 * - Data URIs (fotos subidas por el usuario, en base64): se devuelven tal cual.
 * - Rutas relativas (p. ej. "/recetas/tortilla-de-patatas.jpg", servidas como
 *   recurso estático del backend): se completan con el host detectado del
 *   backend, para que funcionen sin importar la red Wi-Fi del dispositivo.
 */
export function resolveImagenUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${getServerBaseUrl()}${path}`;
}
