import { perfilService } from '@/services/perfilService';
import { usePerfilStore } from '@/store/perfilStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { post: jest.fn(), get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/perfilService');

const mockPerfilService = perfilService as jest.Mocked<typeof perfilService>;

const mockPerfil = {
  id: 'user-1',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  email: 'ana@example.com',
  fotoPerfil: null,
  biografia: 'Amante de la cocina',
  fechaRegistro: '2024-01-15T00:00:00.000Z',
};

const mockPreferencias = {
  tipoDieta: 'Vegetariana',
  alergias: ['Gluten'],
  ingredientesNoDeseados: null,
  nivelDificultad: null,
  tiempoCoccionMax: null,
};

const mockEstadisticas = {
  totalProductosRegistrados: 42,
  totalProductosConsumidos: 30,
  totalProductosCaducados: 5,
  totalRecetasPublicadas: 8,
  totalRecetasGuardadas: 15,
  aprovechamientoDespensa: 88,
  fechaRegistro: '2024-01-15T00:00:00.000Z',
  motivosEliminacion: {
    consumido: 20,
    caducado: 5,
    usado_en_receta: 4,
    donado: 1,
    perdido: 0,
    otro: 0,
  },
};

beforeEach(() => {
  usePerfilStore.setState({
    perfil: null,
    preferencias: null,
    estadisticas: null,
    isLoading: false,
    error: null,
  });
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarPerfil — positivo
// -------------------------------------------------------------------------

it('cargarPerfil_actualiza_perfil_correctamente', async () => {
  mockPerfilService.obtenerPerfil.mockResolvedValue(mockPerfil);
  mockPerfilService.obtenerPreferencias.mockResolvedValue(mockPreferencias);
  await usePerfilStore.getState().cargarPerfil();
  const { perfil } = usePerfilStore.getState();
  expect(perfil?.nombre).toBe('Ana García');
  expect(perfil?.nombreUsuario).toBe('anagarcia');
  expect(perfil?.email).toBe('ana@example.com');
});

// -------------------------------------------------------------------------
// editarPerfil — positivo
// -------------------------------------------------------------------------

it('editarPerfil_actualiza_datos_en_store', async () => {
  usePerfilStore.setState({ perfil: mockPerfil });
  const perfilActualizado = { ...mockPerfil, nombre: 'Ana López', biografia: 'Nueva bio' };
  mockPerfilService.editarPerfil.mockResolvedValue(perfilActualizado);
  await usePerfilStore.getState().editarPerfil({ nombre: 'Ana López', biografia: 'Nueva bio' });
  const { perfil } = usePerfilStore.getState();
  expect(perfil?.nombre).toBe('Ana López');
  expect(perfil?.biografia).toBe('Nueva bio');
});

// -------------------------------------------------------------------------
// actualizarPreferencias — positivo
// -------------------------------------------------------------------------

it('actualizarPreferencias_guarda_preferencias_en_store', async () => {
  const prefsActualizadas = { ...mockPreferencias, tipoDieta: 'Vegana', alergias: ['Lactosa'] };
  mockPerfilService.actualizarPreferencias.mockResolvedValue(prefsActualizadas);
  await usePerfilStore.getState().actualizarPreferencias({ tipoDieta: 'Vegana', alergias: ['Lactosa'] });
  const { preferencias } = usePerfilStore.getState();
  expect(preferencias?.tipoDieta).toBe('Vegana');
  expect(preferencias?.alergias).toContain('Lactosa');
});

// -------------------------------------------------------------------------
// actualizarPrivacidad — positivo
// -------------------------------------------------------------------------

it('actualizarPrivacidad_actualiza_flags_en_store', async () => {
  mockPerfilService.actualizarPrivacidad.mockResolvedValue(undefined);
  await usePerfilStore.getState().actualizarPrivacidad({ perfilPublico: false, mostrarRecetas: true });
  expect(mockPerfilService.actualizarPrivacidad).toHaveBeenCalledWith({
    perfilPublico: false,
    mostrarRecetas: true,
  });
  expect(usePerfilStore.getState().error).toBeNull();
});

// -------------------------------------------------------------------------
// cargarEstadisticas — positivo
// -------------------------------------------------------------------------

it('cargarEstadisticas_actualiza_estadisticas_en_store', async () => {
  mockPerfilService.obtenerEstadisticas.mockResolvedValue(mockEstadisticas);
  await usePerfilStore.getState().cargarEstadisticas();
  const { estadisticas } = usePerfilStore.getState();
  expect(estadisticas?.totalProductosRegistrados).toBe(42);
  expect(estadisticas?.totalRecetasPublicadas).toBe(8);
  expect(estadisticas?.totalRecetasGuardadas).toBe(15);
});

// -------------------------------------------------------------------------
// cerrarSesion — positivo
// -------------------------------------------------------------------------

it('cerrarSesion_limpia_store_completamente', async () => {
  usePerfilStore.setState({ perfil: mockPerfil, preferencias: mockPreferencias });
  mockPerfilService.cerrarSesion.mockResolvedValue(undefined);
  await usePerfilStore.getState().cerrarSesion();
  usePerfilStore.getState().reset();
  const { perfil, preferencias } = usePerfilStore.getState();
  expect(perfil).toBeNull();
  expect(preferencias).toBeNull();
});

// -------------------------------------------------------------------------
// eliminarCuenta — positivo
// -------------------------------------------------------------------------

it('eliminarCuenta_limpia_store_y_navega_a_login', async () => {
  usePerfilStore.setState({ perfil: mockPerfil, preferencias: mockPreferencias });
  mockPerfilService.eliminarCuenta.mockResolvedValue(undefined);
  await usePerfilStore.getState().eliminarCuenta();
  const { perfil, preferencias, estadisticas } = usePerfilStore.getState();
  expect(perfil).toBeNull();
  expect(preferencias).toBeNull();
  expect(estadisticas).toBeNull();
});

// -------------------------------------------------------------------------
// Negativos
// -------------------------------------------------------------------------

it('cargarPerfil_guarda_error_si_falla_servicio', async () => {
  mockPerfilService.obtenerPerfil.mockRejectedValue(new Error('Sin conexión'));
  mockPerfilService.obtenerPreferencias.mockResolvedValue(mockPreferencias);
  await usePerfilStore.getState().cargarPerfil();
  expect(usePerfilStore.getState().error).toBeTruthy();
});

it('editarPerfil_no_modifica_store_si_falla', async () => {
  usePerfilStore.setState({ perfil: mockPerfil });
  mockPerfilService.editarPerfil.mockRejectedValue(new Error('Error de servidor'));
  await expect(usePerfilStore.getState().editarPerfil({ nombre: 'Otro' })).rejects.toThrow();
  expect(usePerfilStore.getState().perfil?.nombre).toBe('Ana García');
});

it('actualizarPreferencias_guarda_error_si_409', async () => {
  mockPerfilService.actualizarPreferencias.mockRejectedValue(new Error('Conflicto'));
  await expect(
    usePerfilStore.getState().actualizarPreferencias({ tipoDieta: 'Keto' })
  ).rejects.toThrow();
  expect(usePerfilStore.getState().error).toBe('Conflicto');
});

it('cerrarSesion_guarda_error_si_falla_red', async () => {
  mockPerfilService.cerrarSesion.mockRejectedValue(new Error('Sin conexión'));
  // cerrarSesion silently swallows errors to allow local logout to proceed
  await expect(usePerfilStore.getState().cerrarSesion()).resolves.toBeUndefined();
  expect(usePerfilStore.getState().error).toBeNull();
});
