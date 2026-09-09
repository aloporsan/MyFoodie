import { apiClient } from '@/services/apiClient';
import { matchingService } from '@/services/matchingService';

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
// buscarSimilares
// -------------------------------------------------------------------------

it('buscarSimilares_devuelve_lista_de_matches_y_pasa_el_nombre_como_query_param', async () => {
  const match = { producto: mockProducto, similitud: 0.9, tipoMatch: 'AUTOMATICO' as const, textoSugerido: '¿Es lo mismo?' };
  mockGet.mockResolvedValue({ data: [match] });

  const resultado = await matchingService.buscarSimilares('leche');

  expect(resultado).toEqual([match]);
  expect(mockGet).toHaveBeenCalledWith('/despensa/productos/similares', { params: { nombre: 'leche' } });
});

// -------------------------------------------------------------------------
// obtenerDuplicados
// -------------------------------------------------------------------------

it('obtenerDuplicados_devuelve_lista_de_pares_duplicados', async () => {
  const par = { productoA: mockProducto, productoB: { ...mockProducto, id: 'prod-2' }, similitud: 0.8, sugerencia: '¿Fusionar?' };
  mockGet.mockResolvedValue({ data: [par] });

  const resultado = await matchingService.obtenerDuplicados();

  expect(resultado).toEqual([par]);
  expect(mockGet).toHaveBeenCalledWith('/despensa/productos/duplicados');
});

// -------------------------------------------------------------------------
// fusionarProductos
// -------------------------------------------------------------------------

it('fusionarProductos_envia_solo_los_ids_cuando_no_hay_overrides', async () => {
  mockPost.mockResolvedValue({ data: mockProducto });

  await matchingService.fusionarProductos('p1', 'p2');

  expect(mockPost).toHaveBeenCalledWith('/despensa/productos/fusionar', {
    productoMantenerId: 'p1',
    productoEliminarId: 'p2',
    unidadElegida: undefined,
    fechaCaducidadElegida: undefined,
  });
});

it('fusionarProductos_envia_unidad_y_fecha_elegidas_cuando_se_proporcionan', async () => {
  mockPost.mockResolvedValue({ data: mockProducto });

  await matchingService.fusionarProductos('p1', 'p2', 'ml', '2026-03-01');

  expect(mockPost).toHaveBeenCalledWith('/despensa/productos/fusionar', {
    productoMantenerId: 'p1',
    productoEliminarId: 'p2',
    unidadElegida: 'ml',
    fechaCaducidadElegida: '2026-03-01',
  });
});

it('fusionarProductos_devuelve_el_producto_resultante', async () => {
  mockPost.mockResolvedValue({ data: mockProducto });

  const resultado = await matchingService.fusionarProductos('p1', 'p2');

  expect(resultado).toEqual(mockProducto);
});

// -------------------------------------------------------------------------
// ignorarFusion
// -------------------------------------------------------------------------

it('ignorarFusion_llama_al_endpoint_con_ambos_ids', async () => {
  mockPost.mockResolvedValue({ data: undefined });

  await matchingService.ignorarFusion('p1', 'p2');

  expect(mockPost).toHaveBeenCalledWith('/despensa/productos/ignorar-fusion', {
    productoAId: 'p1',
    productoBId: 'p2',
  });
});
