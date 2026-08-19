import { RecetaCompartida, compartirService } from '@/services/compartirService';
import { useCompartirStore } from '@/store/compartirStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { post: jest.fn(), get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/compartirService');

const mockCompartirService = compartirService as jest.Mocked<typeof compartirService>;

const ESTADO_INICIAL = {
  recetasRecibidas: [],
  contadorNoLeidas: 0,
  ingredientesFaltantes: [],
  isLoading: false,
  error: null,
};

function recetaCompartida(overrides: Partial<RecetaCompartida> = {}): RecetaCompartida {
  return {
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
      numPersonas: 2,
      etiquetas: [],
      estado: 'publicada',
      ingredientes: [],
      pasos: [],
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
    mensaje: null,
    leida: false,
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  useCompartirStore.setState(ESTADO_INICIAL);
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// Positivos
// -------------------------------------------------------------------------

it('cargarRecibidas_actualiza_recetasRecibidas', async () => {
  mockCompartirService.obtenerRecibidas.mockResolvedValue([recetaCompartida()]);

  await useCompartirStore.getState().cargarRecibidas();

  expect(useCompartirStore.getState().recetasRecibidas).toHaveLength(1);
  expect(useCompartirStore.getState().isLoading).toBe(false);
});

it('marcarComoLeida_actualiza_campo_leida_en_store', async () => {
  useCompartirStore.setState({ recetasRecibidas: [recetaCompartida({ id: 'comp-1', leida: false })] });
  mockCompartirService.marcarComoLeida.mockResolvedValue(undefined);
  mockCompartirService.obtenerContador.mockResolvedValue(0);

  await useCompartirStore.getState().marcarComoLeida('comp-1');

  expect(useCompartirStore.getState().recetasRecibidas[0].leida).toBe(true);
  expect(mockCompartirService.marcarComoLeida).toHaveBeenCalledWith('comp-1');
});

it('guardarRecetaCompartida_llama_al_servicio', async () => {
  useCompartirStore.setState({ recetasRecibidas: [recetaCompartida({ id: 'comp-1', leida: false })] });
  mockCompartirService.guardarRecetaCompartida.mockResolvedValue(undefined);
  mockCompartirService.obtenerContador.mockResolvedValue(0);

  await useCompartirStore.getState().guardarRecetaCompartida('comp-1');

  expect(mockCompartirService.guardarRecetaCompartida).toHaveBeenCalledWith('comp-1');
  expect(useCompartirStore.getState().recetasRecibidas[0].leida).toBe(true);
});

it('cargarContador_actualiza_contadorNoLeidas', async () => {
  mockCompartirService.obtenerContador.mockResolvedValue(5);

  await useCompartirStore.getState().cargarContador();

  expect(useCompartirStore.getState().contadorNoLeidas).toBe(5);
});

it('cargarIngredientesFaltantes_actualiza_ingredientesFaltantes', async () => {
  mockCompartirService.obtenerIngredientesFaltantes.mockResolvedValue([
    { nombre: 'Pasta', cantidad: 200, unidad: 'g' },
  ]);

  await useCompartirStore.getState().cargarIngredientesFaltantes('comp-1');

  expect(useCompartirStore.getState().ingredientesFaltantes).toHaveLength(1);
  expect(mockCompartirService.obtenerIngredientesFaltantes).toHaveBeenCalledWith('comp-1');
});

it('compartirReceta_llama_al_servicio_correctamente', async () => {
  mockCompartirService.compartirReceta.mockResolvedValue([recetaCompartida()]);

  await useCompartirStore.getState().compartirReceta('receta-1', ['user-2'], 'Hola');

  expect(mockCompartirService.compartirReceta).toHaveBeenCalledWith('receta-1', ['user-2'], 'Hola');
});

// -------------------------------------------------------------------------
// Negativos
// -------------------------------------------------------------------------

it('cargarRecibidas_guarda_error_si_falla', async () => {
  mockCompartirService.obtenerRecibidas.mockRejectedValue(new Error('Ha ocurrido un error inesperado'));

  await useCompartirStore.getState().cargarRecibidas();

  expect(useCompartirStore.getState().error).toBe('Ha ocurrido un error inesperado');
  expect(useCompartirStore.getState().recetasRecibidas).toHaveLength(0);
});

it('compartirReceta_guarda_error_si_falla', async () => {
  mockCompartirService.compartirReceta.mockRejectedValue(new Error('La receta no está publicada'));

  await expect(
    useCompartirStore.getState().compartirReceta('receta-1', ['user-2'])
  ).rejects.toThrow();

  expect(useCompartirStore.getState().error).toBe('La receta no está publicada');
});
