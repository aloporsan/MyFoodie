import AsyncStorage from '@react-native-async-storage/async-storage';
import { despensaService } from '@/services/despensaService';
import { useDespensaStore } from '@/store/despensaStore';
import { useFusionStore } from '@/store/fusionStore';

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

beforeEach(async () => {
  useDespensaStore.setState({ ...estadoInicial, ordenActivo: 'reciente_primero' });
  jest.clearAllMocks();
  await AsyncStorage.clear();
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

it('añadirProducto_refresca_los_duplicados_de_la_despensa', async () => {
  const spy = jest.spyOn(useFusionStore.getState(), 'cargarDuplicados').mockResolvedValue(undefined);
  mockService.añadirProducto.mockResolvedValue({ ...mockProducto, id: 'prod-2', nombre: 'Arroz' });

  await useDespensaStore.getState().añadirProducto({ nombre: 'Arroz', cantidad: 1, unidad: 'kg' });

  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();
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
// setOrden / inicializarOrden — ordenación persistente (#137)
// -------------------------------------------------------------------------

it('setOrden_actualiza_ordenActivo_en_store', async () => {
  mockService.listarProductos.mockResolvedValue([]);
  await useDespensaStore.getState().setOrden('nombre_asc');
  expect(useDespensaStore.getState().ordenActivo).toBe('nombre_asc');
});

it('setOrden_guarda_orden_en_asyncstorage', async () => {
  mockService.listarProductos.mockResolvedValue([]);
  await useDespensaStore.getState().setOrden('cantidad_desc');
  const guardado = await AsyncStorage.getItem('despensa_orden');
  expect(guardado).toBe('cantidad_desc');
});

it('setOrden_llama_a_cargarProductos_automaticamente', async () => {
  mockService.listarProductos.mockResolvedValue([mockProducto]);
  await useDespensaStore.getState().setOrden('categoria');
  expect(mockService.listarProductos).toHaveBeenCalledWith('categoria');
  expect(useDespensaStore.getState().productos).toHaveLength(1);
});

it('inicializarOrden_recupera_orden_de_asyncstorage', async () => {
  await AsyncStorage.setItem('despensa_orden', 'caducidad_asc');
  await useDespensaStore.getState().inicializarOrden();
  expect(useDespensaStore.getState().ordenActivo).toBe('caducidad_asc');
});

it('inicializarOrden_usa_reciente_primero_si_no_hay_guardado', async () => {
  await useDespensaStore.getState().inicializarOrden();
  expect(useDespensaStore.getState().ordenActivo).toBe('reciente_primero');
});

it('cargarProductos_usa_ordenActivo_al_llamar_al_servicio', async () => {
  useDespensaStore.setState({ ...estadoInicial, ordenActivo: 'nombre_desc' });
  mockService.listarProductos.mockResolvedValue([]);
  await useDespensaStore.getState().cargarProductos();
  expect(mockService.listarProductos).toHaveBeenCalledWith('nombre_desc');
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
