import { recetaService, Receta, RecetaResumen } from '@/services/recetaService';
import { useRecetaStore } from '@/store/recetaStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/recetaService');

const mockService = recetaService as jest.Mocked<typeof recetaService>;

const mockReceta: Receta = {
  id: 'r1',
  autorId: 'u1',
  titulo: 'Paella valenciana',
  descripcion: 'Receta tradicional',
  tiempoEstimado: 60,
  dificultad: 'Difícil',
  categoria: 'Arroces',
  etiquetas: [],
  estado: 'borrador',
  ingredientes: [],
  pasos: [],
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const mockResumen: RecetaResumen = {
  id: 'r1',
  autorId: 'u1',
  titulo: 'Paella valenciana',
  descripcion: 'Receta tradicional',
  tiempoEstimado: 60,
  dificultad: 'Difícil',
  categoria: 'Arroces',
  etiquetas: [],
  estado: 'borrador',
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const estadoInicial = {
  recetas: [],
  borradores: [],
  recetaActual: null,
  isLoading: false,
  error: null,
};

beforeEach(() => {
  useRecetaStore.setState(estadoInicial);
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarMisRecetas
// -------------------------------------------------------------------------

it('cargarMisRecetas_actualiza_lista_recetas', async () => {
  mockService.misRecetas.mockResolvedValue([mockResumen]);
  await useRecetaStore.getState().cargarMisRecetas();
  expect(useRecetaStore.getState().recetas).toHaveLength(1);
  expect(useRecetaStore.getState().recetas[0].titulo).toBe('Paella valenciana');
  expect(useRecetaStore.getState().isLoading).toBe(false);
});

it('cargarMisRecetas_guarda_error_si_falla', async () => {
  mockService.misRecetas.mockRejectedValue(new Error('Error de red'));
  await useRecetaStore.getState().cargarMisRecetas();
  expect(useRecetaStore.getState().error).toBe('Error de red');
  expect(useRecetaStore.getState().isLoading).toBe(false);
});

// -------------------------------------------------------------------------
// cargarMisBorradores
// -------------------------------------------------------------------------

it('cargarMisBorradores_actualiza_lista_borradores', async () => {
  mockService.misBorradores.mockResolvedValue([mockResumen]);
  await useRecetaStore.getState().cargarMisBorradores();
  expect(useRecetaStore.getState().borradores).toHaveLength(1);
  expect(useRecetaStore.getState().isLoading).toBe(false);
});

// -------------------------------------------------------------------------
// cargarReceta
// -------------------------------------------------------------------------

it('cargarReceta_actualiza_recetaActual', async () => {
  mockService.obtenerReceta.mockResolvedValue(mockReceta);
  await useRecetaStore.getState().cargarReceta('r1');
  expect(useRecetaStore.getState().recetaActual).toEqual(mockReceta);
});

// -------------------------------------------------------------------------
// crearReceta
// -------------------------------------------------------------------------

it('crearReceta_añade_a_borradores_y_setea_recetaActual', async () => {
  mockService.crearReceta.mockResolvedValue(mockReceta);
  await useRecetaStore.getState().crearReceta({
    titulo: 'Paella valenciana',
    descripcion: 'Receta tradicional',
    tiempoEstimado: 60,
    dificultad: 'Difícil',
    categoria: 'Arroces',
    etiquetas: [],
  });
  expect(useRecetaStore.getState().borradores).toHaveLength(1);
  expect(useRecetaStore.getState().recetaActual).toEqual(mockReceta);
});

it('crearReceta_retorna_la_nueva_receta', async () => {
  mockService.crearReceta.mockResolvedValue(mockReceta);
  const result = await useRecetaStore.getState().crearReceta({
    titulo: 'Paella', descripcion: 'Desc', tiempoEstimado: 30,
    dificultad: 'Fácil', categoria: 'Arroces', etiquetas: [],
  });
  expect(result).toEqual(mockReceta);
});

it('crearReceta_guarda_error_si_falla', async () => {
  mockService.crearReceta.mockRejectedValue(new Error('El título es obligatorio'));
  await expect(
    useRecetaStore.getState().crearReceta({ titulo: '', descripcion: '', tiempoEstimado: 0, dificultad: '', categoria: '', etiquetas: [] })
  ).rejects.toThrow();
  expect(useRecetaStore.getState().error).toBe('El título es obligatorio');
});

// -------------------------------------------------------------------------
// editarReceta
// -------------------------------------------------------------------------

it('editarReceta_actualiza_recetaActual_y_listas', async () => {
  const actualizada = { ...mockReceta, titulo: 'Nueva Paella' };
  useRecetaStore.setState({ ...estadoInicial, borradores: [mockResumen], recetaActual: mockReceta });
  mockService.editarReceta.mockResolvedValue(actualizada);
  await useRecetaStore.getState().editarReceta('r1', { titulo: 'Nueva Paella', descripcion: 'Desc', tiempoEstimado: 60, dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [] });
  expect(useRecetaStore.getState().recetaActual?.titulo).toBe('Nueva Paella');
});

// -------------------------------------------------------------------------
// eliminarReceta
// -------------------------------------------------------------------------

it('eliminarReceta_borra_de_ambas_listas', async () => {
  useRecetaStore.setState({ ...estadoInicial, recetas: [mockResumen], borradores: [mockResumen] });
  mockService.eliminarReceta.mockResolvedValue(undefined);
  await useRecetaStore.getState().eliminarReceta('r1');
  expect(useRecetaStore.getState().recetas).toHaveLength(0);
  expect(useRecetaStore.getState().borradores).toHaveLength(0);
});

it('eliminarReceta_limpia_recetaActual_si_es_la_misma', async () => {
  useRecetaStore.setState({ ...estadoInicial, recetaActual: mockReceta });
  mockService.eliminarReceta.mockResolvedValue(undefined);
  await useRecetaStore.getState().eliminarReceta('r1');
  expect(useRecetaStore.getState().recetaActual).toBeNull();
});

// -------------------------------------------------------------------------
// publicarReceta
// -------------------------------------------------------------------------

it('publicarReceta_mueve_de_borradores_a_recetas', async () => {
  const publicada = { ...mockReceta, estado: 'publicada' as const };
  useRecetaStore.setState({ ...estadoInicial, borradores: [mockResumen] });
  mockService.publicarReceta.mockResolvedValue(publicada);
  await useRecetaStore.getState().publicarReceta('r1');
  expect(useRecetaStore.getState().recetas).toHaveLength(1);
  expect(useRecetaStore.getState().borradores).toHaveLength(0);
  expect(useRecetaStore.getState().recetaActual?.estado).toBe('publicada');
});

// -------------------------------------------------------------------------
// guardarComoBorrador
// -------------------------------------------------------------------------

it('guardarComoBorrador_mueve_de_recetas_a_borradores', async () => {
  const borrador = { ...mockReceta, estado: 'borrador' as const };
  useRecetaStore.setState({ ...estadoInicial, recetas: [{ ...mockResumen, estado: 'publicada' }] });
  mockService.guardarComoBorrador.mockResolvedValue(borrador);
  await useRecetaStore.getState().guardarComoBorrador('r1');
  expect(useRecetaStore.getState().borradores).toHaveLength(1);
  expect(useRecetaStore.getState().recetas).toHaveLength(0);
});

// -------------------------------------------------------------------------
// eliminarIngrediente
// -------------------------------------------------------------------------

it('eliminarIngrediente_filtra_ingrediente_de_recetaActual', async () => {
  const recetaConIng: Receta = {
    ...mockReceta,
    ingredientes: [
      { id: 'ing-1', nombre: 'Arroz', cantidad: 200, unidad: 'g' },
      { id: 'ing-2', nombre: 'Sal', cantidad: 5, unidad: 'g' },
    ],
  };
  useRecetaStore.setState({ ...estadoInicial, recetaActual: recetaConIng });
  mockService.eliminarIngrediente.mockResolvedValue(undefined);
  await useRecetaStore.getState().eliminarIngrediente('r1', 'ing-1');
  expect(useRecetaStore.getState().recetaActual?.ingredientes).toHaveLength(1);
  expect(useRecetaStore.getState().recetaActual?.ingredientes[0].id).toBe('ing-2');
});

// -------------------------------------------------------------------------
// eliminarPaso
// -------------------------------------------------------------------------

it('eliminarPaso_filtra_y_renumera_pasos', async () => {
  const recetaConPasos: Receta = {
    ...mockReceta,
    pasos: [
      { id: 'p1', orden: 1, descripcion: 'Paso 1' },
      { id: 'p2', orden: 2, descripcion: 'Paso 2' },
      { id: 'p3', orden: 3, descripcion: 'Paso 3' },
    ],
  };
  useRecetaStore.setState({ ...estadoInicial, recetaActual: recetaConPasos });
  mockService.eliminarPaso.mockResolvedValue(undefined);
  await useRecetaStore.getState().eliminarPaso('r1', 'p2');
  const pasos = useRecetaStore.getState().recetaActual?.pasos ?? [];
  expect(pasos).toHaveLength(2);
  expect(pasos[0].orden).toBe(1);
  expect(pasos[1].orden).toBe(2);
  expect(pasos[1].id).toBe('p3');
});

// -------------------------------------------------------------------------
// clearError / reset
// -------------------------------------------------------------------------

it('clearError_limpia_el_error', () => {
  useRecetaStore.setState({ ...estadoInicial, error: 'Algo falló' });
  useRecetaStore.getState().clearError();
  expect(useRecetaStore.getState().error).toBeNull();
});

it('reset_devuelve_al_estado_inicial', () => {
  useRecetaStore.setState({
    recetas: [mockResumen],
    borradores: [mockResumen],
    recetaActual: mockReceta,
    isLoading: true,
    error: 'error',
  });
  useRecetaStore.getState().reset();
  expect(useRecetaStore.getState()).toMatchObject(estadoInicial);
});
