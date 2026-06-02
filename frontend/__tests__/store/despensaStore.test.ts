import { despensaService } from '@/services/despensaService';
import { useDespensaStore } from '@/store/despensaStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/despensaService');

const mockService = despensaService as jest.Mocked<typeof despensaService>;

const mockProducto = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Leche',
  cantidad: 2,
  unidad: 'litros',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const estadoInicial = {
  productos: [],
  isLoading: false,
  error: null,
  filtrosActivos: {},
  busquedaActiva: '',
};

beforeEach(() => {
  useDespensaStore.setState(estadoInicial);
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarProductos — positivos
// -------------------------------------------------------------------------

it('cargarProductos_actualiza_lista_correctamente', async () => {
  mockService.listarProductos.mockResolvedValue([mockProducto]);
  await useDespensaStore.getState().cargarProductos();
  expect(useDespensaStore.getState().productos).toHaveLength(1);
  expect(useDespensaStore.getState().productos[0].nombre).toBe('Leche');
  expect(useDespensaStore.getState().isLoading).toBe(false);
});

it('cargarProductos_usa_buscarProductos_si_hay_busqueda_activa', async () => {
  useDespensaStore.setState({ ...estadoInicial, busquedaActiva: 'leche' });
  mockService.buscarProductos.mockResolvedValue([mockProducto]);
  await useDespensaStore.getState().cargarProductos();
  expect(mockService.buscarProductos).toHaveBeenCalledWith('leche');
  expect(mockService.listarProductos).not.toHaveBeenCalled();
});

it('cargarProductos_usa_filtrarProductos_si_hay_filtros_activos', async () => {
  useDespensaStore.setState({ ...estadoInicial, filtrosActivos: { categoria: 'Lácteos' } });
  mockService.filtrarProductos.mockResolvedValue([mockProducto]);
  await useDespensaStore.getState().cargarProductos();
  expect(mockService.filtrarProductos).toHaveBeenCalledWith({ categoria: 'Lácteos' });
});

// -------------------------------------------------------------------------
// añadirProducto — positivos
// -------------------------------------------------------------------------

it('añadirProducto_agrega_producto_a_la_lista_existente', async () => {
  useDespensaStore.setState({ ...estadoInicial, productos: [mockProducto] });
  const nuevo = { ...mockProducto, id: 'prod-2', nombre: 'Arroz' };
  mockService.añadirProducto.mockResolvedValue(nuevo);

  await useDespensaStore.getState().añadirProducto({ nombre: 'Arroz', cantidad: 1, unidad: 'kg' });

  const productos = useDespensaStore.getState().productos;
  expect(productos).toHaveLength(2);
  expect(productos[1].nombre).toBe('Arroz');
});

// -------------------------------------------------------------------------
// editarProducto — positivo
// -------------------------------------------------------------------------

it('editarProducto_actualiza_el_producto_en_la_lista', async () => {
  useDespensaStore.setState({ ...estadoInicial, productos: [mockProducto] });
  mockService.editarProducto.mockResolvedValue({ ...mockProducto, nombre: 'Leche Desnatada', cantidad: 3 });

  await useDespensaStore.getState().editarProducto('prod-1', {
    nombre: 'Leche Desnatada',
    cantidad: 3,
    unidad: 'litros',
  });

  const prod = useDespensaStore.getState().productos[0];
  expect(prod.nombre).toBe('Leche Desnatada');
  expect(prod.cantidad).toBe(3);
});

// -------------------------------------------------------------------------
// eliminarProducto — positivo
// -------------------------------------------------------------------------

it('eliminarProducto_elimina_el_producto_de_la_lista', async () => {
  useDespensaStore.setState({ ...estadoInicial, productos: [mockProducto] });
  mockService.eliminarProducto.mockResolvedValue(undefined);

  await useDespensaStore.getState().eliminarProducto('prod-1');

  expect(useDespensaStore.getState().productos).toHaveLength(0);
});

// -------------------------------------------------------------------------
// actualizarCantidad — positivos
// -------------------------------------------------------------------------

it('actualizarCantidad_modifica_cantidad_con_delta_positivo', async () => {
  useDespensaStore.setState({ ...estadoInicial, productos: [mockProducto] });
  mockService.actualizarCantidad.mockResolvedValue({ ...mockProducto, cantidad: 5 });

  await useDespensaStore.getState().actualizarCantidad('prod-1', 3);

  expect(useDespensaStore.getState().productos[0].cantidad).toBe(5);
});

it('actualizarCantidad_modifica_cantidad_con_delta_negativo', async () => {
  useDespensaStore.setState({ ...estadoInicial, productos: [mockProducto] });
  mockService.actualizarCantidad.mockResolvedValue({ ...mockProducto, cantidad: 1 });

  await useDespensaStore.getState().actualizarCantidad('prod-1', -1);

  expect(useDespensaStore.getState().productos[0].cantidad).toBe(1);
});

// -------------------------------------------------------------------------
// setBusqueda / setFiltros / limpiarFiltros
// -------------------------------------------------------------------------

it('setBusqueda_actualiza_busquedaActiva', () => {
  useDespensaStore.getState().setBusqueda('leche');
  expect(useDespensaStore.getState().busquedaActiva).toBe('leche');
});

it('setFiltros_actualiza_filtrosActivos', () => {
  useDespensaStore.getState().setFiltros({ categoria: 'Lácteos', estado: 'caducado' });
  expect(useDespensaStore.getState().filtrosActivos).toEqual({
    categoria: 'Lácteos',
    estado: 'caducado',
  });
});

it('limpiarFiltros_resetea_filtros_y_busqueda_al_estado_inicial', () => {
  useDespensaStore.setState({
    ...estadoInicial,
    busquedaActiva: 'leche',
    filtrosActivos: { categoria: 'Lácteos' },
  });
  useDespensaStore.getState().limpiarFiltros();
  expect(useDespensaStore.getState().busquedaActiva).toBe('');
  expect(useDespensaStore.getState().filtrosActivos).toEqual({});
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('cargarProductos_guarda_el_error_si_falla_el_servicio', async () => {
  mockService.listarProductos.mockRejectedValue(new Error('Error de red'));
  await useDespensaStore.getState().cargarProductos();
  expect(useDespensaStore.getState().error).toBe('Error de red');
  expect(useDespensaStore.getState().isLoading).toBe(false);
});

it('añadirProducto_no_modifica_la_lista_si_falla', async () => {
  useDespensaStore.setState({ ...estadoInicial, productos: [mockProducto] });
  mockService.añadirProducto.mockRejectedValue(new Error('Error'));

  await expect(
    useDespensaStore.getState().añadirProducto({ nombre: '', cantidad: 0, unidad: '' })
  ).rejects.toThrow();

  expect(useDespensaStore.getState().productos).toHaveLength(1);
});

it('eliminarProducto_no_modifica_la_lista_si_falla', async () => {
  useDespensaStore.setState({ ...estadoInicial, productos: [mockProducto] });
  mockService.eliminarProducto.mockRejectedValue(new Error('Error'));

  await expect(
    useDespensaStore.getState().eliminarProducto('prod-1')
  ).rejects.toThrow();

  expect(useDespensaStore.getState().productos).toHaveLength(1);
});
