import { dashboardService } from '@/services/dashboardService';
import { useDashboardStore } from '@/store/dashboardStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/dashboardService');

const mockService = dashboardService as jest.Mocked<typeof dashboardService>;

const mockDashboard = {
  resumen: { totalProductos: 5, caducados: 1, caduca_pronto: 1, caduca_semana: 2, caduca_mes: 3, bajoStock: 1 },
  alertas: [{ id: 'a1', nombre: 'Yogur', cantidad: 1, unidad: 'unidades', fechaCaducidad: null, estado: 'caducado' as const, diasParaCaducar: -5 }],
  prioritarios: [{ id: 'p1', nombre: 'Yogur', cantidad: 1, unidad: 'unidades', estado: 'caducado', motivo: 'caducado' }],
  estadisticas: { totalRegistrados: 5, consumidos: 0, caducadosHistorico: 1, categoriaLider: 'Lácteos', aprovechamiento: 80.0 },
  carrito: { disponible: false, productosRecomendados: 0, sugeridos: [] },
  recetas: { disponible: false },
};

const estadoInicial = {
  resumen: null, alertas: [], prioritarios: [], estadisticas: null,
  carritoResumen: null, recetasRecomendadas: null,
  isLoading: false, error: null, lastUpdated: null,
};

beforeEach(() => {
  useDashboardStore.setState(estadoInicial);
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarDashboard — positivos
// -------------------------------------------------------------------------

it('cargarDashboard_actualiza_todos_los_campos_correctamente', async () => {
  mockService.obtenerDashboard.mockResolvedValue(mockDashboard);
  await useDashboardStore.getState().cargarDashboard();

  const state = useDashboardStore.getState();
  expect(state.resumen?.totalProductos).toBe(5);
  expect(state.alertas).toHaveLength(1);
  expect(state.prioritarios).toHaveLength(1);
  expect(state.estadisticas?.aprovechamiento).toBe(80.0);
  expect(state.lastUpdated).not.toBeNull();
});

it('cargarDashboard_pone_isLoading_false_al_terminar', async () => {
  mockService.obtenerDashboard.mockResolvedValue(mockDashboard);
  await useDashboardStore.getState().cargarDashboard();
  expect(useDashboardStore.getState().isLoading).toBe(false);
});

// -------------------------------------------------------------------------
// refrescar — positivo
// -------------------------------------------------------------------------

it('refrescar_vuelve_a_cargar_los_datos', async () => {
  mockService.obtenerDashboard.mockResolvedValue(mockDashboard);
  await useDashboardStore.getState().refrescar();
  expect(mockService.obtenerDashboard).toHaveBeenCalledTimes(1);
  expect(useDashboardStore.getState().resumen?.totalProductos).toBe(5);
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('cargarDashboard_guarda_error_si_falla_el_servicio', async () => {
  mockService.obtenerDashboard.mockRejectedValue(new Error('Error de red'));
  await useDashboardStore.getState().cargarDashboard();
  expect(useDashboardStore.getState().error).toBe('Error de red');
  expect(useDashboardStore.getState().isLoading).toBe(false);
});

it('cargarDashboard_no_modifica_datos_previos_si_falla', async () => {
  useDashboardStore.setState({ ...estadoInicial, resumen: mockDashboard.resumen });
  mockService.obtenerDashboard.mockRejectedValue(new Error('Error'));

  await useDashboardStore.getState().cargarDashboard();

  // Los datos anteriores siguen intactos
  expect(useDashboardStore.getState().resumen?.totalProductos).toBe(5);
});
