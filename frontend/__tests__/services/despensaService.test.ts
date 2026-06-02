import { apiClient } from '@/services/apiClient';
import { despensaService } from '@/services/despensaService';

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

const mockGet    = apiClient.get    as jest.Mock;
const mockPost   = apiClient.post   as jest.Mock;
const mockPut    = apiClient.put    as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;
const mockPatch  = apiClient.patch  as jest.Mock;

const mockProducto = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Leche Entera',
  cantidad: 2,
  unidad: 'litros',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

beforeEach(() => jest.clearAllMocks());

// -------------------------------------------------------------------------
// listarProductos
// -------------------------------------------------------------------------

it('listarProductos_devuelve_array_de_productos', async () => {
  mockGet.mockResolvedValue({ data: [mockProducto] });
  const result = await despensaService.listarProductos();
  expect(result).toHaveLength(1);
  expect(result[0].nombre).toBe('Leche Entera');
  expect(mockGet).toHaveBeenCalledWith('/despensa/productos');
});

// -------------------------------------------------------------------------
// añadirProducto
// -------------------------------------------------------------------------

it('añadirProducto_devuelve_producto_creado', async () => {
  mockPost.mockResolvedValue({ data: mockProducto });
  const result = await despensaService.añadirProducto({
    nombre: 'Leche Entera',
    cantidad: 2,
    unidad: 'litros',
  });
  expect(result.nombre).toBe('Leche Entera');
  expect(mockPost).toHaveBeenCalledWith('/despensa/productos', {
    nombre: 'Leche Entera',
    cantidad: 2,
    unidad: 'litros',
  });
});

// -------------------------------------------------------------------------
// editarProducto
// -------------------------------------------------------------------------

it('editarProducto_devuelve_producto_actualizado', async () => {
  const actualizado = { ...mockProducto, nombre: 'Leche Desnatada', cantidad: 3 };
  mockPut.mockResolvedValue({ data: actualizado });
  const result = await despensaService.editarProducto('prod-1', {
    nombre: 'Leche Desnatada',
    cantidad: 3,
    unidad: 'litros',
  });
  expect(result.nombre).toBe('Leche Desnatada');
  expect(mockPut).toHaveBeenCalledWith('/despensa/productos/prod-1', expect.any(Object));
});

// -------------------------------------------------------------------------
// eliminarProducto
// -------------------------------------------------------------------------

it('eliminarProducto_resuelve_sin_error', async () => {
  mockDelete.mockResolvedValue({});
  await expect(despensaService.eliminarProducto('prod-1')).resolves.not.toThrow();
  expect(mockDelete).toHaveBeenCalledWith('/despensa/productos/prod-1');
});

// -------------------------------------------------------------------------
// actualizarCantidad
// -------------------------------------------------------------------------

it('actualizarCantidad_devuelve_producto_con_nueva_cantidad', async () => {
  mockPatch.mockResolvedValue({ data: { ...mockProducto, cantidad: 5 } });
  const result = await despensaService.actualizarCantidad('prod-1', 3);
  expect(result.cantidad).toBe(5);
  expect(mockPatch).toHaveBeenCalledWith('/despensa/productos/prod-1/cantidad', { delta: 3 });
});

// -------------------------------------------------------------------------
// buscarProductos
// -------------------------------------------------------------------------

it('buscarProductos_devuelve_coincidencias', async () => {
  mockGet.mockResolvedValue({ data: [mockProducto] });
  const result = await despensaService.buscarProductos('leche');
  expect(result).toHaveLength(1);
  expect(mockGet).toHaveBeenCalledWith('/despensa/productos/buscar', { params: { q: 'leche' } });
});

// -------------------------------------------------------------------------
// filtrarProductos
// -------------------------------------------------------------------------

it('filtrarProductos_devuelve_productos_filtrados', async () => {
  mockGet.mockResolvedValue({ data: [mockProducto] });
  const result = await despensaService.filtrarProductos({ categoria: 'Lácteos' });
  expect(result).toHaveLength(1);
  expect(mockGet).toHaveBeenCalledWith('/despensa/productos/filtrar', {
    params: { categoria: 'Lácteos' },
  });
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('listarProductos_lanza_error_si_401', async () => {
  mockGet.mockRejectedValue(new Error('No autorizado'));
  await expect(despensaService.listarProductos()).rejects.toThrow('No autorizado');
});

it('añadirProducto_lanza_error_si_400', async () => {
  mockPost.mockRejectedValue(new Error('El nombre es obligatorio'));
  await expect(
    despensaService.añadirProducto({ nombre: '', cantidad: 0, unidad: 'kg' })
  ).rejects.toThrow('El nombre es obligatorio');
});

it('eliminarProducto_lanza_error_si_403', async () => {
  mockDelete.mockRejectedValue(new Error('No autorizado'));
  await expect(despensaService.eliminarProducto('prod-ajena')).rejects.toThrow('No autorizado');
});

it('listarProductos_lanza_error_si_falla_red', async () => {
  mockGet.mockRejectedValue(new Error('Network Error'));
  await expect(despensaService.listarProductos()).rejects.toThrow('Network Error');
});
