import { apiClient } from '@/services/apiClient';
import { compartirService } from '@/services/compartirService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  setTokenGetter: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockRecetaCompartida = {
  id: 'comp-1',
  emisor: { nombre: 'Ana García', nombreUsuario: 'anagarcia', fotoPerfil: null },
  receta: {
    id: 'receta-1',
    autorId: 'user-1',
    titulo: 'Ensalada de tomate',
    descripcion: 'Fresca y rápida',
    tiempoEstimado: 10,
    dificultad: 'facil',
    categoria: 'entrante',
    etiquetas: [],
    estado: 'publicada' as const,
    ingredientes: [],
    pasos: [],
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  },
  mensaje: 'Prueba esta receta',
  leida: false,
  createdAt: '2026-01-15T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// Positivos
// -------------------------------------------------------------------------

it('compartirReceta_llama_post_correcto_con_receptorIds_y_mensaje', async () => {
  mockApiClient.post.mockResolvedValue({ data: [mockRecetaCompartida] });

  const result = await compartirService.compartirReceta('receta-1', ['user-2'], 'Prueba esta receta');

  expect(result).toHaveLength(1);
  expect(mockApiClient.post).toHaveBeenCalledWith('/compartir/recetas/receta-1', {
    receptorIds: ['user-2'],
    mensaje: 'Prueba esta receta',
  });
});

it('compartirReceta_sin_mensaje_envia_mensaje_undefined', async () => {
  mockApiClient.post.mockResolvedValue({ data: [mockRecetaCompartida] });

  await compartirService.compartirReceta('receta-1', ['user-2']);

  expect(mockApiClient.post).toHaveBeenCalledWith('/compartir/recetas/receta-1', {
    receptorIds: ['user-2'],
    mensaje: undefined,
  });
});

it('obtenerRecibidas_llama_get_correcto', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockRecetaCompartida] });

  const result = await compartirService.obtenerRecibidas();

  expect(result).toHaveLength(1);
  expect(mockApiClient.get).toHaveBeenCalledWith('/compartir/recibidas');
});

it('marcarComoLeida_llama_put_correcto', async () => {
  mockApiClient.put.mockResolvedValue({ data: undefined });

  await expect(compartirService.marcarComoLeida('comp-1')).resolves.toBeUndefined();

  expect(mockApiClient.put).toHaveBeenCalledWith('/compartir/recibidas/comp-1/leer');
});

it('guardarRecetaCompartida_llama_post_correcto', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });

  await expect(compartirService.guardarRecetaCompartida('comp-1')).resolves.toBeUndefined();

  expect(mockApiClient.post).toHaveBeenCalledWith('/compartir/recibidas/comp-1/guardar');
});

it('obtenerContador_devuelve_numero_de_noLeidas', async () => {
  mockApiClient.get.mockResolvedValue({ data: { noLeidas: 4 } });

  const result = await compartirService.obtenerContador();

  expect(result).toBe(4);
  expect(mockApiClient.get).toHaveBeenCalledWith('/compartir/recibidas/contador');
});

it('obtenerIngredientesFaltantes_llama_get_correcto', async () => {
  mockApiClient.get.mockResolvedValue({
    data: [{ nombre: 'Pasta', cantidad: 200, unidad: 'g' }],
  });

  const result = await compartirService.obtenerIngredientesFaltantes('comp-1');

  expect(result).toHaveLength(1);
  expect(result[0].nombre).toBe('Pasta');
  expect(mockApiClient.get).toHaveBeenCalledWith('/compartir/recibidas/comp-1/ingredientes');
});

// -------------------------------------------------------------------------
// Negativos
// -------------------------------------------------------------------------

it('compartirReceta_lanza_error_si_receta_no_publicada', async () => {
  mockApiClient.post.mockRejectedValue(new Error('La receta no está publicada'));

  await expect(compartirService.compartirReceta('receta-1', ['user-2'])).rejects.toThrow(
    'La receta no está publicada'
  );
});

it('marcarComoLeida_lanza_error_si_no_es_receptor', async () => {
  mockApiClient.put.mockRejectedValue(new Error('No tienes permiso sobre esta receta compartida'));

  await expect(compartirService.marcarComoLeida('comp-1')).rejects.toThrow(
    'No tienes permiso sobre esta receta compartida'
  );
});
