jest.mock('@/services/apiClient', () => ({
  getServerBaseUrl: () => 'http://192.168.1.50:8080',
}));

import { resolveImagenUrl } from '@/utils/media';

it('devuelve_undefined_para_url_vacia_o_nula', () => {
  expect(resolveImagenUrl(undefined)).toBeUndefined();
  expect(resolveImagenUrl(null)).toBeUndefined();
  expect(resolveImagenUrl('')).toBeUndefined();
});

it('devuelve_urls_absolutas_http_https_tal_cual', () => {
  expect(resolveImagenUrl('http://example.com/foto.jpg')).toBe('http://example.com/foto.jpg');
  expect(resolveImagenUrl('https://example.com/foto.jpg')).toBe('https://example.com/foto.jpg');
});

it('devuelve_data_uris_tal_cual', () => {
  const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
  expect(resolveImagenUrl(dataUri)).toBe(dataUri);
});

it('completa_rutas_relativas_con_el_host_del_backend', () => {
  expect(resolveImagenUrl('/recetas/tortilla-de-patatas.jpg')).toBe(
    'http://192.168.1.50:8080/recetas/tortilla-de-patatas.jpg'
  );
});

it('añade_la_barra_inicial_si_falta_en_la_ruta_relativa', () => {
  expect(resolveImagenUrl('recetas/tortilla-de-patatas.jpg')).toBe(
    'http://192.168.1.50:8080/recetas/tortilla-de-patatas.jpg'
  );
});
