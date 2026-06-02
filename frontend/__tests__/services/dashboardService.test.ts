import { apiClient } from '@/services/apiClient';
import { dashboardService } from '@/services/dashboardService';

jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));

const mockGet = apiClient.get as jest.Mock;

const mockDashboard = {
  resumen: { totalProductos: 5, proximosCaducar: 1, caducados: 1, bajoStock: 1 },
  alertas: [{ id: 'a1', nombre: 'Yogur', cantidad: 1, unidad: 'unidades', fechaCaducidad: '2026-01-01', estado: 'caducado', diasParaCaducar: -5 }],
  prioritarios: [{ id: 'p1', nombre: 'Yogur', cantidad: 1, unidad: 'unidades', estado: 'caducado', motivo: 'caducado' }],
  estadisticas: { totalRegistrados: 5, consumidos: 0, caducadosHistorico: 1, categoriaLider: 'Lácteos', aprovechamiento: 80.0 },
  carrito: { disponible: false, productosRecomendados: 0, sugeridos: [] },
  recetas: { disponible: false },
};

beforeEach(() => jest.clearAllMocks());

// -------------------------------------------------------------------------
// positivos
// -------------------------------------------------------------------------

it('obtenerDashboard_devuelve_estructura_completa', async () => {
  mockGet.mockResolvedValue({ data: mockDashboard });
  const result = await dashboardService.obtenerDashboard();
  expect(result.resumen).toBeDefined();
  expect(result.alertas).toBeDefined();
  expect(result.prioritarios).toBeDefined();
  expect(result.estadisticas).toBeDefined();
  expect(result.carrito).toBeDefined();
  expect(result.recetas).toBeDefined();
  expect(mockGet).toHaveBeenCalledWith('/dashboard');
});

it('obtenerAlertas_devuelve_array', async () => {
  mockGet.mockResolvedValue({ data: mockDashboard.alertas });
  const result = await dashboardService.obtenerAlertas();
  expect(Array.isArray(result)).toBe(true);
  expect(mockGet).toHaveBeenCalledWith('/dashboard/alertas');
});

it('obtenerPrioritarios_devuelve_array', async () => {
  mockGet.mockResolvedValue({ data: mockDashboard.prioritarios });
  const result = await dashboardService.obtenerPrioritarios();
  expect(Array.isArray(result)).toBe(true);
  expect(mockGet).toHaveBeenCalledWith('/dashboard/prioritarios');
});

it('obtenerEstadisticas_devuelve_datos_correctos', async () => {
  mockGet.mockResolvedValue({ data: mockDashboard.estadisticas });
  const result = await dashboardService.obtenerEstadisticas();
  expect(result.aprovechamiento).toBe(80.0);
  expect(result.categoriaLider).toBe('Lácteos');
  expect(mockGet).toHaveBeenCalledWith('/dashboard/estadisticas');
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('obtenerDashboard_lanza_error_si_401', async () => {
  mockGet.mockRejectedValue(new Error('No autorizado'));
  await expect(dashboardService.obtenerDashboard()).rejects.toThrow('No autorizado');
});

it('obtenerDashboard_lanza_error_si_falla_red', async () => {
  mockGet.mockRejectedValue(new Error('Network Error'));
  await expect(dashboardService.obtenerDashboard()).rejects.toThrow('Network Error');
});
