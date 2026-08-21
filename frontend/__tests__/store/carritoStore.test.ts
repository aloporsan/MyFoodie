import { carritoService } from '@/services/carritoService';
import { useCarritoStore } from '@/store/carritoStore';

jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/carritoService');

const mockService = carritoService as jest.Mocked<typeof carritoService>;

const mockItem = {
  id: 'item-1',
  usuarioId: 'user-1',
  nombre: 'Leche',
  cantidad: 2,
  unidad: 'litros',
  categoria: 'Lácteos',
  prioridad: 'alta' as const,
  motivo: 'Tu stock de Leche es bajo',
  estado: 'pendiente' as const,
  noVolver: false,
  productoEnDespensa: false,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const mockLista = {
  id: 'lista-1',
  nombre: 'Lista del 1 de enero',
  items: [mockItem],
  estado: 'activa' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const estadoInicial = {
  items: [],
  resumen: null,
  listas: [],
  listaActiva: null,
  listaEnCurso: null,
  isLoading: false,
  isGenerando: false,
  error: null,
};

beforeEach(() => {
  useCarritoStore.setState({ ...estadoInicial });
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarCarrito / generarCarrito
// -------------------------------------------------------------------------

it('cargarCarrito_actualiza_items_y_resumen', async () => {
  mockService.obtenerCarrito.mockResolvedValue({
    items: [mockItem],
    resumen: { totalItems: 1, itemsAlta: 1, itemsMedia: 0, itemsBaja: 0, itemsAceptados: 0 },
  });
  await useCarritoStore.getState().cargarCarrito();
  expect(useCarritoStore.getState().items).toHaveLength(1);
  expect(useCarritoStore.getState().resumen?.totalItems).toBe(1);
  expect(useCarritoStore.getState().isLoading).toBe(false);
});

it('cargarCarrito_guarda_el_error_si_falla_el_servicio', async () => {
  mockService.obtenerCarrito.mockRejectedValue(new Error('Error de red'));
  await useCarritoStore.getState().cargarCarrito();
  expect(useCarritoStore.getState().error).toBe('Error de red');
  expect(useCarritoStore.getState().isLoading).toBe(false);
});

it('generarCarrito_actualiza_items_y_marca_isGenerando_false_al_terminar', async () => {
  mockService.generarCarrito.mockResolvedValue({
    items: [mockItem],
    resumen: { totalItems: 1, itemsAlta: 1, itemsMedia: 0, itemsBaja: 0, itemsAceptados: 0 },
  });
  await useCarritoStore.getState().generarCarrito();
  expect(useCarritoStore.getState().items).toHaveLength(1);
  expect(useCarritoStore.getState().isGenerando).toBe(false);
});

// -------------------------------------------------------------------------
// aceptarItem / rechazarItem / marcarNoVolver / recuperarItem
// -------------------------------------------------------------------------

it('aceptarItem_actualiza_el_item_en_la_lista', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.aceptarItem.mockResolvedValue({ ...mockItem, estado: 'aceptado' });

  await useCarritoStore.getState().aceptarItem('item-1');

  expect(useCarritoStore.getState().items[0].estado).toBe('aceptado');
});

it('aceptarItem_es_optimista_actualiza_antes_de_que_resuelva_la_peticion', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.aceptarItem.mockReturnValue(new Promise(() => {})); // nunca se resuelve en el test

  const promesa = useCarritoStore.getState().aceptarItem('item-1');

  // El estado ya refleja el cambio sin esperar la respuesta del backend.
  expect(useCarritoStore.getState().items[0].estado).toBe('aceptado');
  await promesa;
});

it('aceptarItem_revierte_el_cambio_optimista_si_falla_la_peticion', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.aceptarItem.mockRejectedValue(new Error('Error de red'));

  await useCarritoStore.getState().aceptarItem('item-1');
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(useCarritoStore.getState().items[0].estado).toBe('pendiente');
  expect(useCarritoStore.getState().error).toBe('Error de red');
});

it('rechazarItem_actualiza_el_item_en_la_lista', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.rechazarItem.mockResolvedValue({ ...mockItem, estado: 'rechazado' });

  await useCarritoStore.getState().rechazarItem('item-1');

  expect(useCarritoStore.getState().items[0].estado).toBe('rechazado');
});

it('rechazarItem_es_optimista_actualiza_antes_de_que_resuelva_la_peticion', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.rechazarItem.mockReturnValue(new Promise(() => {})); // nunca se resuelve en el test

  const promesa = useCarritoStore.getState().rechazarItem('item-1');

  // El estado ya refleja el cambio sin esperar la respuesta del backend.
  expect(useCarritoStore.getState().items[0].estado).toBe('rechazado');
  await promesa;
});

it('rechazarItem_revierte_el_cambio_optimista_si_falla_la_peticion', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.rechazarItem.mockRejectedValue(new Error('Error de red'));

  await useCarritoStore.getState().rechazarItem('item-1');
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(useCarritoStore.getState().items[0].estado).toBe('pendiente');
  expect(useCarritoStore.getState().error).toBe('Error de red');
});

it('marcarNoVolver_propaga_el_error_si_falla', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.marcarNoVolver.mockRejectedValue(new Error('Error'));

  await expect(useCarritoStore.getState().marcarNoVolver('item-1')).rejects.toThrow();
  expect(useCarritoStore.getState().error).toBe('Error');
});

it('recuperarItem_actualiza_el_item_en_la_lista', async () => {
  const rechazado = { ...mockItem, estado: 'rechazado' as const, noVolver: true };
  useCarritoStore.setState({ ...estadoInicial, items: [rechazado] });
  mockService.recuperarItem.mockResolvedValue({ ...mockItem, estado: 'pendiente', noVolver: false });

  await useCarritoStore.getState().recuperarItem('item-1');

  expect(useCarritoStore.getState().items[0].estado).toBe('pendiente');
  expect(useCarritoStore.getState().items[0].noVolver).toBe(false);
});

// -------------------------------------------------------------------------
// modificarCantidad — sincroniza items, listas, listaActiva y listaEnCurso
// -------------------------------------------------------------------------

it('modificarCantidad_actualiza_cantidad_y_unidad_en_items', async () => {
  useCarritoStore.setState({ ...estadoInicial, items: [mockItem] });
  mockService.modificarCantidad.mockResolvedValue({ ...mockItem, cantidad: 500, unidad: 'g' });

  await useCarritoStore.getState().modificarCantidad('item-1', 500, 'g');

  expect(useCarritoStore.getState().items[0].cantidad).toBe(500);
  expect(useCarritoStore.getState().items[0].unidad).toBe('g');
  expect(mockService.modificarCantidad).toHaveBeenCalledWith('item-1', 500, 'g');
});

it('modificarCantidad_sincroniza_el_item_en_listaActiva_y_listaEnCurso', async () => {
  useCarritoStore.setState({
    ...estadoInicial,
    listaActiva: mockLista,
    listaEnCurso: mockLista,
    listas: [mockLista],
  });
  mockService.modificarCantidad.mockResolvedValue({ ...mockItem, cantidad: 3, unidad: 'litros' });

  await useCarritoStore.getState().modificarCantidad('item-1', 3, 'litros');

  expect(useCarritoStore.getState().listaActiva?.items[0].cantidad).toBe(3);
  expect(useCarritoStore.getState().listaEnCurso?.items[0].cantidad).toBe(3);
  expect(useCarritoStore.getState().listas[0].items[0].cantidad).toBe(3);
});

// -------------------------------------------------------------------------
// añadirItemManual / eliminarItem
// -------------------------------------------------------------------------

it('añadirItemManual_agrega_el_item_a_la_lista', async () => {
  const nuevo = { ...mockItem, id: 'item-2', nombre: 'Café' };
  mockService.añadirItemManual.mockResolvedValue(nuevo);

  await useCarritoStore.getState().añadirItemManual({ nombre: 'Café', cantidad: 1, unidad: 'paquetes' });

  expect(useCarritoStore.getState().items).toHaveLength(1);
  expect(useCarritoStore.getState().items[0].nombre).toBe('Café');
});

it('eliminarItem_quita_el_item_de_items_listas_listaActiva_y_listaEnCurso', async () => {
  useCarritoStore.setState({
    ...estadoInicial,
    items: [mockItem],
    listas: [mockLista],
    listaActiva: mockLista,
    listaEnCurso: mockLista,
  });
  mockService.eliminarItem.mockResolvedValue(undefined);

  await useCarritoStore.getState().eliminarItem('item-1');

  expect(useCarritoStore.getState().items).toHaveLength(0);
  expect(useCarritoStore.getState().listas[0].items).toHaveLength(0);
  expect(useCarritoStore.getState().listaActiva?.items).toHaveLength(0);
  expect(useCarritoStore.getState().listaEnCurso?.items).toHaveLength(0);
});

// -------------------------------------------------------------------------
// generarListaCompra / cargarListas / cargarLista / cargarListaEnCurso
// -------------------------------------------------------------------------

it('generarListaCompra_establece_listaActiva_y_listaEnCurso_y_la_antepone_a_listas', async () => {
  mockService.generarListaCompra.mockResolvedValue(mockLista);

  const resultado = await useCarritoStore.getState().generarListaCompra('Compra semanal');

  expect(resultado.id).toBe('lista-1');
  expect(useCarritoStore.getState().listaActiva?.id).toBe('lista-1');
  expect(useCarritoStore.getState().listaEnCurso?.id).toBe('lista-1');
  expect(useCarritoStore.getState().listas[0].id).toBe('lista-1');
});

it('cargarListas_actualiza_el_array_de_listas', async () => {
  mockService.obtenerListas.mockResolvedValue([mockLista]);
  await useCarritoStore.getState().cargarListas();
  expect(useCarritoStore.getState().listas).toHaveLength(1);
});

it('cargarLista_actualiza_listaActiva', async () => {
  mockService.obtenerLista.mockResolvedValue(mockLista);
  await useCarritoStore.getState().cargarLista('lista-1');
  expect(useCarritoStore.getState().listaActiva?.id).toBe('lista-1');
});

it('cargarListaEnCurso_guarda_null_si_no_hay_ninguna_activa', async () => {
  mockService.obtenerListaActiva.mockResolvedValue(null);
  await useCarritoStore.getState().cargarListaEnCurso();
  expect(useCarritoStore.getState().listaEnCurso).toBeNull();
});

// -------------------------------------------------------------------------
// alternarComprado — actualización optimista con rollback
// -------------------------------------------------------------------------

it('alternarComprado_marca_el_item_como_comprado_de_forma_optimista', async () => {
  useCarritoStore.setState({ ...estadoInicial, listaActiva: mockLista });
  mockService.marcarComprado.mockResolvedValue({ ...mockItem, estado: 'comprado' });

  const promesa = useCarritoStore.getState().alternarComprado('lista-1', 'item-1');

  // Antes de que resuelva la promesa, el cambio ya debe reflejarse (optimista).
  expect(useCarritoStore.getState().listaActiva?.items[0].estado).toBe('comprado');

  await promesa;
  expect(mockService.marcarComprado).toHaveBeenCalledWith('lista-1', 'item-1');
  expect(useCarritoStore.getState().listaActiva?.items[0].estado).toBe('comprado');
});

it('alternarComprado_desmarca_usando_aceptarItem_cuando_ya_estaba_comprado', async () => {
  const comprado = { ...mockItem, estado: 'comprado' as const };
  const listaConComprado = { ...mockLista, items: [comprado] };
  useCarritoStore.setState({ ...estadoInicial, listaActiva: listaConComprado });
  mockService.aceptarItem.mockResolvedValue({ ...mockItem, estado: 'aceptado' });

  await useCarritoStore.getState().alternarComprado('lista-1', 'item-1');

  expect(mockService.aceptarItem).toHaveBeenCalledWith('item-1');
  expect(useCarritoStore.getState().listaActiva?.items[0].estado).toBe('aceptado');
});

it('alternarComprado_revierte_el_cambio_optimista_si_falla_la_peticion', async () => {
  useCarritoStore.setState({ ...estadoInicial, listaActiva: mockLista });
  mockService.marcarComprado.mockRejectedValue(new Error('Error de red'));

  await expect(useCarritoStore.getState().alternarComprado('lista-1', 'item-1')).rejects.toThrow();

  expect(useCarritoStore.getState().listaActiva?.items[0].estado).toBe('pendiente');
  expect(useCarritoStore.getState().error).toBe('Error de red');
});

it('alternarComprado_no_hace_nada_si_la_listaId_no_coincide_con_listaActiva', async () => {
  useCarritoStore.setState({ ...estadoInicial, listaActiva: mockLista });

  await useCarritoStore.getState().alternarComprado('otra-lista', 'item-1');

  expect(mockService.marcarComprado).not.toHaveBeenCalled();
  expect(mockService.aceptarItem).not.toHaveBeenCalled();
});

// -------------------------------------------------------------------------
// añadirCompradosADespensa
// -------------------------------------------------------------------------

it('añadirCompradosADespensa_actualiza_la_lista_y_limpia_listaEnCurso_si_coincide', async () => {
  const listaCompletada = { ...mockLista, estado: 'completada' as const };
  useCarritoStore.setState({
    ...estadoInicial,
    listas: [mockLista],
    listaActiva: mockLista,
    listaEnCurso: mockLista,
  });
  mockService.añadirCompradosADespensa.mockResolvedValue(listaCompletada);

  await useCarritoStore.getState().añadirCompradosADespensa('lista-1');

  expect(useCarritoStore.getState().listaActiva?.estado).toBe('completada');
  expect(useCarritoStore.getState().listas[0].estado).toBe('completada');
  expect(useCarritoStore.getState().listaEnCurso).toBeNull();
});

it('añadirCompradosADespensa_no_limpia_listaEnCurso_si_pertenece_a_otra_lista', async () => {
  const otraListaEnCurso = { ...mockLista, id: 'lista-2' };
  useCarritoStore.setState({ ...estadoInicial, listaEnCurso: otraListaEnCurso });
  mockService.añadirCompradosADespensa.mockResolvedValue({ ...mockLista, estado: 'completada' as const });

  await useCarritoStore.getState().añadirCompradosADespensa('lista-1');

  expect(useCarritoStore.getState().listaEnCurso?.id).toBe('lista-2');
});

it('añadirCompradosADespensa_propaga_el_error_si_falla', async () => {
  mockService.añadirCompradosADespensa.mockRejectedValue(new Error('La lista no tiene productos comprados'));

  await expect(useCarritoStore.getState().añadirCompradosADespensa('lista-1'))
    .rejects.toThrow('La lista no tiene productos comprados');
  expect(useCarritoStore.getState().error).toBe('La lista no tiene productos comprados');
});
