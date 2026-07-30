import { feedService, RecetaFeed } from '@/services/feedService';
import { useFeedStore } from '@/store/feedStore';

jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/feedService');

const mockService = feedService as jest.Mocked<typeof feedService>;

const mockReceta = (overrides: Partial<RecetaFeed> = {}): RecetaFeed => ({
  id: 'receta-1',
  titulo: 'Tortilla de patatas',
  autorId: 'autor-1',
  tiempoEstimado: 40,
  dificultad: 'Media',
  etiquetas: ['vegetariano'],
  likes: 3,
  yaLike: false,
  yaGuardada: false,
  coincidenciaDespensa: 50,
  ingredientesDisponibles: 1,
  ingredientesFaltantes: 1,
  createdAt: '2026-01-01T10:00:00',
  ...overrides,
});

const estadoInicial = {
  recetas: [],
  pagina: 0,
  hayMas: false,
  isLoading: false,
  isLoadingMas: false,
  error: null,
  ultimaAccion: null,
};

beforeEach(() => {
  useFeedStore.setState({ ...estadoInicial });
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarFeed
// -------------------------------------------------------------------------

it('cargarFeed_actualiza_recetas_pagina_y_hayMas', async () => {
  mockService.obtenerFeed.mockResolvedValue({
    recetas: [mockReceta()],
    pagina: 0,
    totalPaginas: 3,
    hayMas: true,
  });

  await useFeedStore.getState().cargarFeed();

  expect(useFeedStore.getState().recetas).toHaveLength(1);
  expect(useFeedStore.getState().hayMas).toBe(true);
  expect(useFeedStore.getState().isLoading).toBe(false);
});

it('cargarFeed_guarda_el_error_si_falla_el_servicio', async () => {
  mockService.obtenerFeed.mockRejectedValue(new Error('Error de red'));

  await useFeedStore.getState().cargarFeed();

  expect(useFeedStore.getState().error).toBe('Error de red');
  expect(useFeedStore.getState().recetas).toHaveLength(0);
});

// -------------------------------------------------------------------------
// descartarReceta — quita la receta del feed y guarda la acción para deshacer
// -------------------------------------------------------------------------

it('descartarReceta_elimina_la_receta_de_la_lista', async () => {
  useFeedStore.setState({ ...estadoInicial, recetas: [mockReceta({ id: 'receta-1' }), mockReceta({ id: 'receta-2' })] });
  mockService.descartarReceta.mockResolvedValue(undefined);

  await useFeedStore.getState().descartarReceta('receta-1');

  const recetas = useFeedStore.getState().recetas;
  expect(recetas).toHaveLength(1);
  expect(recetas[0].id).toBe('receta-2');
});

// -------------------------------------------------------------------------
// darLike / quitarLike — actualización optimista
// -------------------------------------------------------------------------

it('darLike_marca_yaLike_e_incrementa_el_contador', async () => {
  useFeedStore.setState({ ...estadoInicial, recetas: [mockReceta({ likes: 3, yaLike: false })] });
  mockService.darLike.mockResolvedValue(undefined);

  await useFeedStore.getState().darLike('receta-1');

  const receta = useFeedStore.getState().recetas[0];
  expect(receta.yaLike).toBe(true);
  expect(receta.likes).toBe(4);
});

it('quitarLike_desmarca_yaLike_y_no_deja_el_contador_bajar_de_cero', async () => {
  useFeedStore.setState({ ...estadoInicial, recetas: [mockReceta({ likes: 0, yaLike: true })] });
  mockService.quitarLike.mockResolvedValue(undefined);

  await useFeedStore.getState().quitarLike('receta-1');

  const receta = useFeedStore.getState().recetas[0];
  expect(receta.yaLike).toBe(false);
  expect(receta.likes).toBe(0);
});

// -------------------------------------------------------------------------
// deshacerUltimaAccion — restaura una receta descartada en su posición original
// -------------------------------------------------------------------------

it('deshacerUltimaAccion_reinserta_la_receta_descartada_en_su_indice_original', async () => {
  const r1 = mockReceta({ id: 'receta-1' });
  const r2 = mockReceta({ id: 'receta-2' });
  const r3 = mockReceta({ id: 'receta-3' });
  useFeedStore.setState({ ...estadoInicial, recetas: [r1, r2, r3] });
  mockService.descartarReceta.mockResolvedValue(undefined);
  mockService.deshacerUltimaAccion.mockResolvedValue(undefined);

  await useFeedStore.getState().descartarReceta('receta-2');
  expect(useFeedStore.getState().recetas.map((r) => r.id)).toEqual(['receta-1', 'receta-3']);

  await useFeedStore.getState().deshacerUltimaAccion();

  expect(useFeedStore.getState().recetas.map((r) => r.id)).toEqual(['receta-1', 'receta-2', 'receta-3']);
  expect(useFeedStore.getState().ultimaAccion).toBeNull();
});

it('deshacerUltimaAccion_no_hace_nada_si_no_hay_ninguna_accion_registrada', async () => {
  useFeedStore.setState({ ...estadoInicial, recetas: [mockReceta()] });

  await useFeedStore.getState().deshacerUltimaAccion();

  expect(mockService.deshacerUltimaAccion).not.toHaveBeenCalled();
});
