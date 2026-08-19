import { apiClient } from '@/services/apiClient';
import { feedService, PerfilGustos, RecetaFeed } from '@/services/feedService';

jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockReceta: RecetaFeed = {
  id: 'receta-1',
  titulo: 'Tortilla de patatas',
  autorId: 'autor-1',
  tiempoEstimado: 40,
  dificultad: 'Media',
  numPersonas: 2,
  etiquetas: ['vegetariano'],
  likes: 3,
  yaLike: false,
  yaGuardada: false,
  coincidenciaDespensa: 50,
  ingredientesDisponibles: 1,
  ingredientesFaltantes: 1,
  createdAt: '2026-01-01T10:00:00',
};

const mockPerfilGustos: PerfilGustos = {
  usuarioId: 'usuario-1',
  categoriasPreferidas: { Cena: 5 },
  etiquetasPreferidas: {},
  dificultadesPreferidas: {},
  tiempoMaximoHabitual: 45,
  ingredientesHabituales: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// Positivos
// -------------------------------------------------------------------------

it('obtenerFeed_llama_get_con_pagina_y_tamaño_y_devuelve_la_respuesta', async () => {
  mockApiClient.get.mockResolvedValue({
    data: { recetas: [mockReceta], pagina: 0, totalPaginas: 3, hayMas: true },
  });

  const result = await feedService.obtenerFeed(0, 10);

  expect(result.recetas).toHaveLength(1);
  expect(result.hayMas).toBe(true);
  expect(mockApiClient.get).toHaveBeenCalledWith('/feed', { params: { pagina: 0, tamaño: 10 } });
});

it('guardarReceta_llama_post_correcto', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });

  await expect(feedService.guardarReceta('receta-1')).resolves.toBeUndefined();

  expect(mockApiClient.post).toHaveBeenCalledWith('/feed/recetas/receta-1/guardar');
});

it('descartarReceta_llama_post_correcto', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });

  await expect(feedService.descartarReceta('receta-1')).resolves.toBeUndefined();

  expect(mockApiClient.post).toHaveBeenCalledWith('/feed/recetas/receta-1/descartar');
});

it('darLike_llama_post_correcto', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });

  await expect(feedService.darLike('receta-1')).resolves.toBeUndefined();

  expect(mockApiClient.post).toHaveBeenCalledWith('/feed/recetas/receta-1/like');
});

it('quitarLike_llama_delete_correcto', async () => {
  mockApiClient.delete.mockResolvedValue({ data: undefined });

  await expect(feedService.quitarLike('receta-1')).resolves.toBeUndefined();

  expect(mockApiClient.delete).toHaveBeenCalledWith('/feed/recetas/receta-1/like');
});

it('deshacerUltimaAccion_llama_post_correcto', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });

  await expect(feedService.deshacerUltimaAccion()).resolves.toBeUndefined();

  expect(mockApiClient.post).toHaveBeenCalledWith('/feed/deshacer');
});

it('obtenerDetalle_llama_get_correcto_y_devuelve_la_receta', async () => {
  mockApiClient.get.mockResolvedValue({ data: { id: 'receta-1', titulo: 'Tortilla de patatas' } });

  const result = await feedService.obtenerDetalle('receta-1');

  expect(result.id).toBe('receta-1');
  expect(mockApiClient.get).toHaveBeenCalledWith('/feed/recetas/receta-1');
});

it('obtenerPerfilGustos_devuelve_el_perfil_de_gustos', async () => {
  mockApiClient.get.mockResolvedValue({ data: mockPerfilGustos });

  const result = await feedService.obtenerPerfilGustos();

  expect(result.usuarioId).toBe('usuario-1');
  expect(mockApiClient.get).toHaveBeenCalledWith('/feed/perfil-gustos');
});

it('resetearPerfilGustos_llama_delete_correcto', async () => {
  mockApiClient.delete.mockResolvedValue({ data: undefined });

  await expect(feedService.resetearPerfilGustos()).resolves.toBeUndefined();

  expect(mockApiClient.delete).toHaveBeenCalledWith('/feed/perfil-gustos');
});

it('limpiarDescartadas_llama_delete_correcto', async () => {
  mockApiClient.delete.mockResolvedValue({ data: undefined });

  await expect(feedService.limpiarDescartadas()).resolves.toBeUndefined();

  expect(mockApiClient.delete).toHaveBeenCalledWith('/feed/descartadas');
});

it('obtenerRecetasSeguidos_llama_get_con_pagina_y_tamaño', async () => {
  mockApiClient.get.mockResolvedValue({
    data: { recetas: [mockReceta], pagina: 1, totalPaginas: 2, hayMas: false },
  });

  const result = await feedService.obtenerRecetasSeguidos(1, 10);

  expect(result.pagina).toBe(1);
  expect(mockApiClient.get).toHaveBeenCalledWith('/feed/recetas-seguidos', { params: { pagina: 1, tamaño: 10 } });
});

// -------------------------------------------------------------------------
// Negativos
// -------------------------------------------------------------------------

it('obtenerFeed_lanza_error_si_falla_la_peticion', async () => {
  mockApiClient.get.mockRejectedValue(new Error('Error de red'));

  await expect(feedService.obtenerFeed(0, 10)).rejects.toThrow('Error de red');
});

it('darLike_lanza_error_si_409_ya_le_dio_like', async () => {
  mockApiClient.post.mockRejectedValue(new Error('Ya has dado like a esta receta'));

  await expect(feedService.darLike('receta-1')).rejects.toThrow('Ya has dado like a esta receta');
});

it('obtenerPerfilGustos_lanza_error_si_falla_la_peticion', async () => {
  mockApiClient.get.mockRejectedValue(new Error('Error de red'));

  await expect(feedService.obtenerPerfilGustos()).rejects.toThrow('Error de red');
});
