import { matchingService } from '@/services/matchingService';
import { useDespensaStore } from '@/store/despensaStore';
import { useFusionStore } from '@/store/fusionStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/matchingService');
jest.mock('@/services/despensaService');

const mockMatching = matchingService as jest.Mocked<typeof matchingService>;

const producto = (id: string, nombre: string) => ({
  id,
  despensaId: 'desp-1',
  nombre,
  cantidad: 1,
  unidad: 'unidad',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
});

const parDuplicado = {
  productoA: producto('p1', 'Leche'),
  productoB: producto('p2', 'Leche entera'),
  similitud: 0.9,
  sugerencia: '¿Fusionar?',
};

const estadoInicial = { duplicados: [], isLoading: false, error: null };

beforeEach(() => {
  useFusionStore.setState(estadoInicial);
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarDuplicados
// -------------------------------------------------------------------------

it('cargarDuplicados_actualiza_la_lista_de_pares', async () => {
  mockMatching.obtenerDuplicados.mockResolvedValue([parDuplicado]);

  await useFusionStore.getState().cargarDuplicados();

  expect(useFusionStore.getState().duplicados).toEqual([parDuplicado]);
  expect(useFusionStore.getState().isLoading).toBe(false);
});

it('cargarDuplicados_guarda_el_error_si_falla_el_servicio', async () => {
  mockMatching.obtenerDuplicados.mockRejectedValue(new Error('Error de red'));

  await useFusionStore.getState().cargarDuplicados();

  expect(useFusionStore.getState().error).toBe('Error de red');
  expect(useFusionStore.getState().duplicados).toEqual([]);
});

// -------------------------------------------------------------------------
// fusionarProductos
// -------------------------------------------------------------------------

it('fusionarProductos_quita_el_par_fusionado_de_la_lista', async () => {
  useFusionStore.setState({ ...estadoInicial, duplicados: [parDuplicado] });
  mockMatching.fusionarProductos.mockResolvedValue(producto('p1', 'Leche'));

  await useFusionStore.getState().fusionarProductos('p1', 'p2');

  expect(useFusionStore.getState().duplicados).toHaveLength(0);
});

it('fusionarProductos_reenvia_unidad_y_fecha_elegidas_al_servicio', async () => {
  mockMatching.fusionarProductos.mockResolvedValue(producto('p1', 'Leche'));

  await useFusionStore.getState().fusionarProductos('p1', 'p2', 'l', '2026-03-01');

  expect(mockMatching.fusionarProductos).toHaveBeenCalledWith('p1', 'p2', 'l', '2026-03-01');
});

it('fusionarProductos_refresca_la_despensa_tras_fusionar', async () => {
  const spy = jest.spyOn(useDespensaStore.getState(), 'cargarProductos').mockResolvedValue(undefined);
  mockMatching.fusionarProductos.mockResolvedValue(producto('p1', 'Leche'));

  await useFusionStore.getState().fusionarProductos('p1', 'p2');

  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});

it('fusionarProductos_no_modifica_la_lista_si_falla', async () => {
  useFusionStore.setState({ ...estadoInicial, duplicados: [parDuplicado] });
  mockMatching.fusionarProductos.mockRejectedValue(new Error('Error'));

  await expect(useFusionStore.getState().fusionarProductos('p1', 'p2')).rejects.toThrow();

  expect(useFusionStore.getState().duplicados).toEqual([parDuplicado]);
});

// -------------------------------------------------------------------------
// ignorarFusion
// -------------------------------------------------------------------------

it('ignorarFusion_quita_el_par_ignorado_de_la_lista', async () => {
  useFusionStore.setState({ ...estadoInicial, duplicados: [parDuplicado] });
  mockMatching.ignorarFusion.mockResolvedValue(undefined);

  await useFusionStore.getState().ignorarFusion('p1', 'p2');

  expect(useFusionStore.getState().duplicados).toHaveLength(0);
});

it('ignorarFusion_no_modifica_la_lista_si_falla', async () => {
  useFusionStore.setState({ ...estadoInicial, duplicados: [parDuplicado] });
  mockMatching.ignorarFusion.mockRejectedValue(new Error('Error'));

  await expect(useFusionStore.getState().ignorarFusion('p1', 'p2')).rejects.toThrow();

  expect(useFusionStore.getState().duplicados).toEqual([parDuplicado]);
});
