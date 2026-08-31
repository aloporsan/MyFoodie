import { apiClient } from '@/services/apiClient';
import { carritoService } from '@/services/carritoService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
  setTokenGetter: jest.fn(),
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

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

beforeEach(() => jest.clearAllMocks());

// -------------------------------------------------------------------------
// obtenerCarrito / generarCarrito
// -------------------------------------------------------------------------

it('obtenerCarrito_devuelve_items_y_resumen', async () => {
  mockGet.mockResolvedValue({ data: { items: [mockItem], resumen: { totalItems: 1, itemsAlta: 1, itemsMedia: 0, itemsBaja: 0, itemsAceptados: 0 } } });
  const result = await carritoService.obtenerCarrito();
  expect(result.items).toHaveLength(1);
  expect(mockGet).toHaveBeenCalledWith('/carrito');
});

it('generarCarrito_llama_al_endpoint_de_generar', async () => {
  mockPost.mockResolvedValue({ data: { items: [mockItem], resumen: {} } });
  await carritoService.generarCarrito();
  expect(mockPost).toHaveBeenCalledWith('/carrito/generar');
});

// -------------------------------------------------------------------------
// aceptarItem / rechazarItem / marcarNoVolver / recuperarItem
// -------------------------------------------------------------------------

it('aceptarItem_devuelve_item_con_estado_aceptado', async () => {
  mockPut.mockResolvedValue({ data: { ...mockItem, estado: 'aceptado' } });
  const result = await carritoService.aceptarItem('item-1');
  expect(result.estado).toBe('aceptado');
  expect(mockPut).toHaveBeenCalledWith('/carrito/items/item-1/aceptar');
});

it('rechazarItem_devuelve_item_con_estado_rechazado', async () => {
  mockPut.mockResolvedValue({ data: { ...mockItem, estado: 'rechazado' } });
  const result = await carritoService.rechazarItem('item-1');
  expect(result.estado).toBe('rechazado');
  expect(mockPut).toHaveBeenCalledWith('/carrito/items/item-1/rechazar');
});

it('marcarNoVolver_devuelve_item_con_noVolver_true', async () => {
  mockPut.mockResolvedValue({ data: { ...mockItem, estado: 'rechazado', noVolver: true } });
  const result = await carritoService.marcarNoVolver('item-1');
  expect(result.noVolver).toBe(true);
  expect(mockPut).toHaveBeenCalledWith('/carrito/items/item-1/no-volver');
});

it('recuperarItem_devuelve_item_con_estado_pendiente', async () => {
  mockPut.mockResolvedValue({ data: { ...mockItem, estado: 'pendiente', noVolver: false } });
  const result = await carritoService.recuperarItem('item-1');
  expect(result.estado).toBe('pendiente');
  expect(mockPut).toHaveBeenCalledWith('/carrito/items/item-1/recuperar');
});

// -------------------------------------------------------------------------
// modificarCantidad — incluye cambio de unidad
// -------------------------------------------------------------------------

it('modificarCantidad_envia_cantidad_y_unidad_en_el_body', async () => {
  mockPut.mockResolvedValue({ data: { ...mockItem, cantidad: 500, unidad: 'g' } });
  const result = await carritoService.modificarCantidad('item-1', 500, 'g');
  expect(result.cantidad).toBe(500);
  expect(result.unidad).toBe('g');
  expect(mockPut).toHaveBeenCalledWith('/carrito/items/item-1/cantidad', { cantidad: 500, unidad: 'g' });
});

it('modificarCantidad_envia_unidad_undefined_si_no_se_especifica', async () => {
  mockPut.mockResolvedValue({ data: { ...mockItem, cantidad: 3 } });
  await carritoService.modificarCantidad('item-1', 3);
  expect(mockPut).toHaveBeenCalledWith('/carrito/items/item-1/cantidad', { cantidad: 3, unidad: undefined });
});

// -------------------------------------------------------------------------
// añadirItemManual / eliminarItem
// -------------------------------------------------------------------------

it('añadirItemManual_devuelve_el_resultado_con_accion_e_item_creado', async () => {
  const resultadoEsperado = { accion: 'creado' as const, item: mockItem, itemExistente: null, similitud: null };
  mockPost.mockResolvedValue({ data: resultadoEsperado });
  const result = await carritoService.añadirItemManual({ nombre: 'Leche', cantidad: 2, unidad: 'litros' });
  expect(result.accion).toBe('creado');
  expect(result.item.nombre).toBe('Leche');
  expect(mockPost).toHaveBeenCalledWith('/carrito/items', { nombre: 'Leche', cantidad: 2, unidad: 'litros' });
});

it('eliminarItem_resuelve_sin_error', async () => {
  mockDelete.mockResolvedValue({});
  await expect(carritoService.eliminarItem('item-1')).resolves.not.toThrow();
  expect(mockDelete).toHaveBeenCalledWith('/carrito/items/item-1');
});

// -------------------------------------------------------------------------
// generarListaCompra / obtenerListas / obtenerLista / obtenerListaActiva
// -------------------------------------------------------------------------

it('generarListaCompra_sin_nombre_no_envia_body', async () => {
  mockPost.mockResolvedValue({ data: mockLista });
  await carritoService.generarListaCompra();
  expect(mockPost).toHaveBeenCalledWith('/carrito/lista', {});
});

it('generarListaCompra_con_nombre_lo_envia_en_el_body', async () => {
  mockPost.mockResolvedValue({ data: mockLista });
  await carritoService.generarListaCompra('Compra semanal');
  expect(mockPost).toHaveBeenCalledWith('/carrito/lista', { nombre: 'Compra semanal' });
});

it('obtenerListas_devuelve_array_de_listas', async () => {
  mockGet.mockResolvedValue({ data: [mockLista] });
  const result = await carritoService.obtenerListas();
  expect(result).toHaveLength(1);
  expect(mockGet).toHaveBeenCalledWith('/carrito/listas');
});

it('obtenerLista_devuelve_la_lista_solicitada', async () => {
  mockGet.mockResolvedValue({ data: mockLista });
  const result = await carritoService.obtenerLista('lista-1');
  expect(result.id).toBe('lista-1');
  expect(mockGet).toHaveBeenCalledWith('/carrito/listas/lista-1');
});

it('obtenerListaActiva_devuelve_la_lista_si_hay_una_activa_200', async () => {
  mockGet.mockResolvedValue({ data: mockLista, status: 200 });
  const result = await carritoService.obtenerListaActiva();
  expect(result?.id).toBe('lista-1');
});

it('obtenerListaActiva_devuelve_null_si_204_sin_contenido', async () => {
  mockGet.mockResolvedValue({ data: null, status: 204 });
  const result = await carritoService.obtenerListaActiva();
  expect(result).toBeNull();
});

// -------------------------------------------------------------------------
// marcarComprado / añadirCompradosADespensa
// -------------------------------------------------------------------------

it('marcarComprado_devuelve_item_con_estado_comprado', async () => {
  mockPut.mockResolvedValue({ data: { ...mockItem, estado: 'comprado' } });
  const result = await carritoService.marcarComprado('lista-1', 'item-1');
  expect(result.estado).toBe('comprado');
  expect(mockPut).toHaveBeenCalledWith('/carrito/listas/lista-1/items/item-1/comprado');
});

it('añadirCompradosADespensa_sin_ajustes_envia_array_vacio', async () => {
  mockPost.mockResolvedValue({ data: { resultados: [], lista: { ...mockLista, estado: 'completada' } } });
  const result = await carritoService.añadirCompradosADespensa('lista-1');
  expect(result.lista.estado).toBe('completada');
  expect(mockPost).toHaveBeenCalledWith('/carrito/listas/lista-1/añadir-despensa', []);
});

it('añadirCompradosADespensa_con_ajustes_los_envia_en_el_body', async () => {
  mockPost.mockResolvedValue({ data: { resultados: [], lista: { ...mockLista, estado: 'completada' } } });
  const ajustes = [{ itemId: 'item-1', cantidad: 500, unidad: 'g' }];
  await carritoService.añadirCompradosADespensa('lista-1', ajustes);
  expect(mockPost).toHaveBeenCalledWith('/carrito/listas/lista-1/añadir-despensa', ajustes);
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('obtenerCarrito_lanza_error_si_401', async () => {
  mockGet.mockRejectedValue(new Error('No autorizado'));
  await expect(carritoService.obtenerCarrito()).rejects.toThrow('No autorizado');
});

it('generarListaCompra_lanza_error_si_400_sin_aceptados', async () => {
  mockPost.mockRejectedValue(new Error('No hay items aceptados para generar la lista'));
  await expect(carritoService.generarListaCompra()).rejects.toThrow('No hay items aceptados para generar la lista');
});

it('aceptarItem_lanza_error_si_403_de_otro_usuario', async () => {
  mockPut.mockRejectedValue(new Error('No tienes permiso sobre este item'));
  await expect(carritoService.aceptarItem('item-ajeno')).rejects.toThrow('No tienes permiso sobre este item');
});
