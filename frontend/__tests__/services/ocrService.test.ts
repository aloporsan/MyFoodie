import { apiClient, getAuthToken, getServerBaseUrl } from '@/services/apiClient';
import { ocrService } from '@/services/ocrService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
  setTokenGetter: jest.fn(),
  getAuthToken: jest.fn(),
  getServerBaseUrl: jest.fn(),
}));

const mockPost = apiClient.post as jest.Mock;
const mockGetAuthToken = getAuthToken as jest.Mock;
const mockGetServerBaseUrl = getServerBaseUrl as jest.Mock;

const mockFormData = { append: jest.fn() } as unknown as FormData;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetServerBaseUrl.mockReturnValue('http://192.168.1.1:8080');
  mockGetAuthToken.mockReturnValue('token-abc');
  global.fetch = jest.fn();
});

// -------------------------------------------------------------------------
// procesarTicket
// -------------------------------------------------------------------------

it('procesarTicket_hace_POST_por_fetch_a_la_url_del_backend_con_el_token', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  await ocrService.procesarTicket(mockFormData);

  expect(global.fetch).toHaveBeenCalledWith(
    'http://192.168.1.1:8080/api/despensa/ocr/procesar',
    expect.objectContaining({
      method: 'POST',
      body: mockFormData,
      headers: { Authorization: 'Bearer token-abc' },
    })
  );
});

it('procesarTicket_sin_token_no_manda_cabecera_authorization', async () => {
  mockGetAuthToken.mockReturnValue(null);
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });

  await ocrService.procesarTicket(mockFormData);

  expect(global.fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ headers: undefined })
  );
});

it('procesarTicket_devuelve_los_resultados_del_json_de_respuesta', async () => {
  const resultados = [
    {
      productoTicket: { nombreDetectado: 'Tomate', cantidadDetectada: 2, unidadDetectada: null, lineaOriginal: '2 TOMATE' },
      accion: 'nuevo',
      productoExistente: null,
      similitud: null,
      mensajeSugerencia: null,
    },
  ];
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => resultados });

  const result = await ocrService.procesarTicket(mockFormData);

  expect(result).toEqual(resultados);
});

it('procesarTicket_con_respuesta_no_ok_lanza_el_mensaje_del_servidor', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    json: async () => ({ message: 'La imagen no puede superar los 10MB' }),
  });

  await expect(ocrService.procesarTicket(mockFormData)).rejects.toThrow(
    'La imagen no puede superar los 10MB'
  );
});

it('procesarTicket_con_respuesta_no_ok_y_sin_json_valido_usa_mensaje_generico', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    json: async () => { throw new Error('no es json'); },
  });

  await expect(ocrService.procesarTicket(mockFormData)).rejects.toThrow(
    'No se pudo procesar el ticket. Inténtalo de nuevo.'
  );
});

it('procesarTicket_con_error_de_red_lanza_mensaje_de_sin_conexion', async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));

  await expect(ocrService.procesarTicket(mockFormData)).rejects.toThrow(
    'Sin conexión. Comprueba tu red e inténtalo de nuevo.'
  );
});

it('procesarTicket_con_abort_lanza_mensaje_de_timeout', async () => {
  const abortError = new Error('Aborted');
  abortError.name = 'AbortError';
  (global.fetch as jest.Mock).mockRejectedValue(abortError);

  await expect(ocrService.procesarTicket(mockFormData)).rejects.toThrow(
    'La operación ha tardado demasiado. Inténtalo de nuevo.'
  );
});

// -------------------------------------------------------------------------
// confirmarProductos
// -------------------------------------------------------------------------

it('confirmarProductos_manda_los_productos_por_POST_via_apiClient', async () => {
  const resumen = { añadidos: 1, actualizados: 0, ignorados: 0 };
  mockPost.mockResolvedValue({ data: resumen });

  const productos = [
    { nombre: 'Tomate', cantidad: 2, unidad: 'unidad', accion: 'nuevo' as const },
  ];
  const result = await ocrService.confirmarProductos(productos);

  expect(result).toEqual(resumen);
  expect(mockPost).toHaveBeenCalledWith('/despensa/ocr/confirmar', productos);
});
