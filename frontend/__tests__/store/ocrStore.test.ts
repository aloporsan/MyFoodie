import { ocrService } from '@/services/ocrService';
import { useOCRStore } from '@/store/ocrStore';

jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
  getAuthToken: jest.fn(),
  getServerBaseUrl: jest.fn(),
}));
jest.mock('@/services/ocrService');

const mockOcr = ocrService as jest.Mocked<typeof ocrService>;

const estadoInicial = { resultados: [], isProcessing: false, isConfirming: false, error: null };

const resultado = {
  productoTicket: { nombreDetectado: 'Tomate', cantidadDetectada: 2, unidadDetectada: null, lineaOriginal: '2 TOMATE' },
  accion: 'nuevo' as const,
  productoExistente: null,
  similitud: null,
  mensajeSugerencia: null,
};

beforeEach(() => {
  useOCRStore.setState(estadoInicial);
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// procesarTicket
// -------------------------------------------------------------------------

it('procesarTicket_guarda_los_resultados_y_desactiva_isProcessing', async () => {
  mockOcr.procesarTicket.mockResolvedValue([resultado]);

  const devuelto = await useOCRStore.getState().procesarTicket(new FormData());

  expect(devuelto).toEqual([resultado]);
  expect(useOCRStore.getState().resultados).toEqual([resultado]);
  expect(useOCRStore.getState().isProcessing).toBe(false);
  expect(useOCRStore.getState().error).toBeNull();
});

it('procesarTicket_activa_isProcessing_mientras_esta_en_curso', () => {
  mockOcr.procesarTicket.mockReturnValue(new Promise(() => {}));

  useOCRStore.getState().procesarTicket(new FormData());

  expect(useOCRStore.getState().isProcessing).toBe(true);
});

it('procesarTicket_si_falla_guarda_el_error_y_relanza', async () => {
  mockOcr.procesarTicket.mockRejectedValue(new Error('Sin conexión'));

  await expect(useOCRStore.getState().procesarTicket(new FormData())).rejects.toThrow('Sin conexión');

  expect(useOCRStore.getState().error).toBe('Sin conexión');
  expect(useOCRStore.getState().isProcessing).toBe(false);
});

// -------------------------------------------------------------------------
// confirmarProductos
// -------------------------------------------------------------------------

it('confirmarProductos_limpia_resultados_y_desactiva_isConfirming', async () => {
  useOCRStore.setState({ resultados: [resultado] });
  const resumen = { añadidos: 1, actualizados: 0, ignorados: 0 };
  mockOcr.confirmarProductos.mockResolvedValue(resumen);

  const devuelto = await useOCRStore.getState().confirmarProductos([]);

  expect(devuelto).toEqual(resumen);
  expect(useOCRStore.getState().resultados).toEqual([]);
  expect(useOCRStore.getState().isConfirming).toBe(false);
});

it('confirmarProductos_si_falla_guarda_el_error_y_relanza', async () => {
  mockOcr.confirmarProductos.mockRejectedValue(new Error('No se pudieron añadir'));

  await expect(useOCRStore.getState().confirmarProductos([])).rejects.toThrow('No se pudieron añadir');

  expect(useOCRStore.getState().error).toBe('No se pudieron añadir');
  expect(useOCRStore.getState().isConfirming).toBe(false);
});

// -------------------------------------------------------------------------
// limpiarResultados
// -------------------------------------------------------------------------

it('limpiarResultados_restaura_el_estado_inicial', () => {
  useOCRStore.setState({ resultados: [resultado], error: 'algo falló', isProcessing: true });

  useOCRStore.getState().limpiarResultados();

  expect(useOCRStore.getState()).toMatchObject(estadoInicial);
});
