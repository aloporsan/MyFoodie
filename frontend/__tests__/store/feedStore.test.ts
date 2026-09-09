import { FILTROS_RECETA_VACIOS } from '@/constants/filtrosReceta';
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
  numPersonas: 2,
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
  fuente: 'para-ti' as const,
  filtros: FILTROS_RECETA_VACIOS,
  pagina: 0,
  hayMas: false,
  isLoading: false,
  isLoadingMas: false,
  error: null,
  ultimaAccion: null,
  perfilGustos: null,
  isLoadingPerfilGustos: false,
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
// guardarReceta / descartarReceta — actualización optimista
// -------------------------------------------------------------------------

it('guardarReceta_elimina_carta_inmediatamente_sin_esperar_api', () => {
  useFeedStore.setState({
    ...estadoInicial,
    recetas: [mockReceta({ id: 'receta-1' }), mockReceta({ id: 'receta-2' })],
  });
  mockService.guardarReceta.mockReturnValue(new Promise(() => {})); // nunca se resuelve en el test

  useFeedStore.getState().guardarReceta('receta-1');

  expect(useFeedStore.getState().recetas.map((r) => r.id)).toEqual(['receta-2']);
});

it('guardarReceta_revierte_estado_si_api_falla', async () => {
  const recetasIniciales = [mockReceta({ id: 'receta-1' }), mockReceta({ id: 'receta-2' })];
  useFeedStore.setState({ ...estadoInicial, recetas: recetasIniciales });
  mockService.guardarReceta.mockRejectedValue(new Error('Error de red'));

  await useFeedStore.getState().guardarReceta('receta-1');

  expect(useFeedStore.getState().recetas.map((r) => r.id)).toEqual(['receta-1', 'receta-2']);
  expect(useFeedStore.getState().error).toBe('Error de red');
  expect(useFeedStore.getState().ultimaAccion).toBeNull();
});

it('descartarReceta_elimina_carta_inmediatamente_sin_esperar_api', () => {
  useFeedStore.setState({
    ...estadoInicial,
    recetas: [mockReceta({ id: 'receta-1' }), mockReceta({ id: 'receta-2' })],
  });
  mockService.descartarReceta.mockReturnValue(new Promise(() => {})); // nunca se resuelve en el test

  useFeedStore.getState().descartarReceta('receta-1');

  expect(useFeedStore.getState().recetas.map((r) => r.id)).toEqual(['receta-2']);
});

it('descartarReceta_revierte_estado_si_api_falla', async () => {
  const recetasIniciales = [mockReceta({ id: 'receta-1' }), mockReceta({ id: 'receta-2' })];
  useFeedStore.setState({ ...estadoInicial, recetas: recetasIniciales });
  mockService.descartarReceta.mockRejectedValue(new Error('Error de red'));

  await useFeedStore.getState().descartarReceta('receta-1');

  expect(useFeedStore.getState().recetas.map((r) => r.id)).toEqual(['receta-1', 'receta-2']);
  expect(useFeedStore.getState().error).toBe('Error de red');
  expect(useFeedStore.getState().ultimaAccion).toBeNull();
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

// -------------------------------------------------------------------------
// cargarFeed — fuente 'seguidos' usa el servicio de recetas de seguidos
// -------------------------------------------------------------------------

it('cargarFeed_con_fuente_seguidos_llama_a_obtenerRecetasSeguidos', async () => {
  mockService.obtenerRecetasSeguidos.mockResolvedValue({
    recetas: [mockReceta()],
    pagina: 0,
    totalPaginas: 1,
    hayMas: false,
  });

  await useFeedStore.getState().cargarFeed('seguidos');

  expect(mockService.obtenerRecetasSeguidos).toHaveBeenCalledWith(0, 10);
  expect(mockService.obtenerFeed).not.toHaveBeenCalled();
  expect(useFeedStore.getState().fuente).toBe('seguidos');
  expect(useFeedStore.getState().recetas).toHaveLength(1);
});

// -------------------------------------------------------------------------
// cargarMas
// -------------------------------------------------------------------------

it('cargarMas_añade_recetas_a_las_existentes_y_avanza_de_pagina', async () => {
  useFeedStore.setState({ ...estadoInicial, recetas: [mockReceta({ id: 'receta-1' })], pagina: 0, hayMas: true });
  mockService.obtenerFeed.mockResolvedValue({
    recetas: [mockReceta({ id: 'receta-2' })],
    pagina: 1,
    totalPaginas: 2,
    hayMas: false,
  });

  await useFeedStore.getState().cargarMas();

  expect(mockService.obtenerFeed).toHaveBeenCalledWith(1, 10);
  expect(useFeedStore.getState().recetas.map((r) => r.id)).toEqual(['receta-1', 'receta-2']);
  expect(useFeedStore.getState().hayMas).toBe(false);
});

it('cargarMas_no_hace_nada_si_no_hay_mas_paginas', async () => {
  useFeedStore.setState({ ...estadoInicial, hayMas: false });

  await useFeedStore.getState().cargarMas();

  expect(mockService.obtenerFeed).not.toHaveBeenCalled();
});

it('cargarMas_guarda_el_error_si_falla_el_servicio', async () => {
  useFeedStore.setState({ ...estadoInicial, hayMas: true });
  mockService.obtenerFeed.mockRejectedValue(new Error('Error de red'));

  await useFeedStore.getState().cargarMas();

  expect(useFeedStore.getState().error).toBe('Error de red');
  expect(useFeedStore.getState().isLoadingMas).toBe(false);
});

// -------------------------------------------------------------------------
// aplicarFiltros — filtros multidimensionales (#37 ampliado)
// -------------------------------------------------------------------------

const filtrosDificultad = { ...FILTROS_RECETA_VACIOS, dificultades: ['Fácil'] };

it('aplicarFiltros_guarda_los_filtros_y_recarga_pasandolos_al_servicio', async () => {
  mockService.obtenerFeed.mockResolvedValue({ recetas: [], pagina: 0, totalPaginas: 0, hayMas: false });

  await useFeedStore.getState().aplicarFiltros(filtrosDificultad);

  expect(useFeedStore.getState().filtros).toEqual(filtrosDificultad);
  expect(mockService.obtenerFeed).toHaveBeenCalledWith(0, 10, filtrosDificultad);
});

it('los_filtros_se_aplican_también_a_la_fuente_seguidos', async () => {
  useFeedStore.setState({ ...estadoInicial, fuente: 'seguidos', filtros: filtrosDificultad });
  mockService.obtenerRecetasSeguidos.mockResolvedValue({ recetas: [], pagina: 0, totalPaginas: 0, hayMas: false });

  await useFeedStore.getState().cargarFeed('seguidos');

  expect(mockService.obtenerRecetasSeguidos).toHaveBeenCalledWith(0, 10, filtrosDificultad);
});

it('los_filtros_persisten_al_cambiar_de_fuente', async () => {
  useFeedStore.setState({ ...estadoInicial, filtros: filtrosDificultad });
  mockService.obtenerRecetasSeguidos.mockResolvedValue({ recetas: [], pagina: 0, totalPaginas: 0, hayMas: false });

  await useFeedStore.getState().cargarFeed('seguidos');

  expect(useFeedStore.getState().filtros).toEqual(filtrosDificultad);
});

it('sin_filtros_activos_el_servicio_se_llama_sin_el_argumento_de_filtros', async () => {
  mockService.obtenerFeed.mockResolvedValue({ recetas: [], pagina: 0, totalPaginas: 0, hayMas: false });

  await useFeedStore.getState().cargarFeed();

  expect(mockService.obtenerFeed).toHaveBeenCalledWith(0, 10);
});

// -------------------------------------------------------------------------
// cargarPerfilGustos
// -------------------------------------------------------------------------

const mockPerfilGustos = {
  usuarioId: 'usuario-1',
  categoriasPreferidas: { Cena: 5 },
  etiquetasPreferidas: {},
  dificultadesPreferidas: {},
  tiempoMaximoHabitual: 45,
  ingredientesHabituales: [],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

it('cargarPerfilGustos_actualiza_el_perfil_en_el_store', async () => {
  mockService.obtenerPerfilGustos.mockResolvedValue(mockPerfilGustos);

  await useFeedStore.getState().cargarPerfilGustos();

  expect(useFeedStore.getState().perfilGustos).toEqual(mockPerfilGustos);
  expect(useFeedStore.getState().isLoadingPerfilGustos).toBe(false);
});

it('cargarPerfilGustos_guarda_el_error_si_falla_el_servicio', async () => {
  mockService.obtenerPerfilGustos.mockRejectedValue(new Error('Error de red'));

  await useFeedStore.getState().cargarPerfilGustos();

  expect(useFeedStore.getState().error).toBe('Error de red');
  expect(useFeedStore.getState().perfilGustos).toBeNull();
});

// -------------------------------------------------------------------------
// resetearPerfilGustos
// -------------------------------------------------------------------------

it('resetearPerfilGustos_deja_el_perfil_en_null', async () => {
  useFeedStore.setState({ ...estadoInicial, perfilGustos: mockPerfilGustos });
  mockService.resetearPerfilGustos.mockResolvedValue(undefined);

  await useFeedStore.getState().resetearPerfilGustos();

  expect(useFeedStore.getState().perfilGustos).toBeNull();
});

it('resetearPerfilGustos_no_modifica_el_perfil_si_falla_y_relanza_el_error', async () => {
  useFeedStore.setState({ ...estadoInicial, perfilGustos: mockPerfilGustos });
  mockService.resetearPerfilGustos.mockRejectedValue(new Error('Error de red'));

  await expect(useFeedStore.getState().resetearPerfilGustos()).rejects.toThrow();

  expect(useFeedStore.getState().perfilGustos).toEqual(mockPerfilGustos);
  expect(useFeedStore.getState().error).toBe('Error de red');
});

// -------------------------------------------------------------------------
// limpiarDescartadas
// -------------------------------------------------------------------------

it('limpiarDescartadas_recarga_el_feed_con_la_fuente_activa', async () => {
  useFeedStore.setState({ ...estadoInicial, fuente: 'seguidos' });
  mockService.limpiarDescartadas.mockResolvedValue(undefined);
  mockService.obtenerRecetasSeguidos.mockResolvedValue({
    recetas: [mockReceta()],
    pagina: 0,
    totalPaginas: 1,
    hayMas: false,
  });

  await useFeedStore.getState().limpiarDescartadas();

  expect(mockService.limpiarDescartadas).toHaveBeenCalled();
  expect(mockService.obtenerRecetasSeguidos).toHaveBeenCalledWith(0, 10);
  expect(useFeedStore.getState().recetas).toHaveLength(1);
});

it('limpiarDescartadas_guarda_el_error_y_relanza_si_falla', async () => {
  mockService.limpiarDescartadas.mockRejectedValue(new Error('Error de red'));

  await expect(useFeedStore.getState().limpiarDescartadas()).rejects.toThrow();

  expect(useFeedStore.getState().error).toBe('Error de red');
  expect(mockService.obtenerFeed).not.toHaveBeenCalled();
});

// -------------------------------------------------------------------------
// limpiarFeed
// -------------------------------------------------------------------------

it('limpiarFeed_restaura_el_estado_inicial', () => {
  useFeedStore.setState({
    ...estadoInicial,
    recetas: [mockReceta()],
    fuente: 'seguidos',
    perfilGustos: mockPerfilGustos,
    error: 'algún error',
  });

  useFeedStore.getState().limpiarFeed();

  expect(useFeedStore.getState().recetas).toHaveLength(0);
  expect(useFeedStore.getState().fuente).toBe('para-ti');
  expect(useFeedStore.getState().perfilGustos).toBeNull();
  expect(useFeedStore.getState().error).toBeNull();
});
