import { apiClient } from '@/services/apiClient';
import { perfilService } from '@/services/perfilService';

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
  fechaRegistro: '2024-01-15T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// Positivos
// -------------------------------------------------------------------------

it('obtenerPerfil_devuelve_datos_correctos', async () => {
  mockApiClient.get.mockResolvedValue({ data: mockPerfil });
  const result = await perfilService.obtenerPerfil();
  expect(result.nombre).toBe('Ana García');
  expect(result.email).toBe('ana@example.com');
  expect(mockApiClient.get).toHaveBeenCalledWith('/perfil');
});

it('editarPerfil_devuelve_perfil_actualizado', async () => {
  const actualizado = { ...mockPerfil, nombre: 'Ana López' };
  mockApiClient.put.mockResolvedValue({ data: actualizado });
  const result = await perfilService.editarPerfil({ nombre: 'Ana López' });
  expect(result.nombre).toBe('Ana López');
  expect(mockApiClient.put).toHaveBeenCalledWith('/perfil', { nombre: 'Ana López' });
});

it('obtenerPreferencias_devuelve_preferencias', async () => {
  mockApiClient.get.mockResolvedValue({ data: mockPreferencias });
  const result = await perfilService.obtenerPreferencias();
  expect(result.tipoDieta).toBe('Vegetariana');
  expect(result.alergias).toContain('Gluten');
  expect(mockApiClient.get).toHaveBeenCalledWith('/perfil/preferencias');
});

it('actualizarPreferencias_devuelve_preferencias_actualizadas', async () => {
  const actualizado = { ...mockPreferencias, tipoDieta: 'Vegana' };
  mockApiClient.put.mockResolvedValue({ data: actualizado });
  const result = await perfilService.actualizarPreferencias({ tipoDieta: 'Vegana' });
  expect(result.tipoDieta).toBe('Vegana');
});

it('actualizarPrivacidad_devuelve_200', async () => {
  mockApiClient.put.mockResolvedValue({ data: undefined });
  await expect(
    perfilService.actualizarPrivacidad({ perfilPublico: false })
  ).resolves.toBeUndefined();
  expect(mockApiClient.put).toHaveBeenCalledWith('/perfil/privacidad', { perfilPublico: false });
});

it('obtenerEstadisticas_devuelve_contadores', async () => {
  mockApiClient.get.mockResolvedValue({ data: mockEstadisticas });
  const result = await perfilService.obtenerEstadisticas();
  expect(result.totalProductosRegistrados).toBe(42);
  expect(result.totalRecetasPublicadas).toBe(8);
  expect(mockApiClient.get).toHaveBeenCalledWith('/perfil/estadisticas');
});

it('cerrarSesion_devuelve_200', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });
  await expect(perfilService.cerrarSesion()).resolves.toBeUndefined();
  expect(mockApiClient.post).toHaveBeenCalledWith('/perfil/cerrar-sesion');
});

it('eliminarCuenta_devuelve_204', async () => {
  mockApiClient.delete.mockResolvedValue({ data: undefined });
  await expect(perfilService.eliminarCuenta()).resolves.toBeUndefined();
  expect(mockApiClient.delete).toHaveBeenCalledWith('/perfil', { data: { confirmar: true } });
});

// -------------------------------------------------------------------------
// Negativos
// -------------------------------------------------------------------------

it('obtenerPerfil_lanza_error_si_401', async () => {
  mockApiClient.get.mockRejectedValue(new Error('No autorizado'));
  await expect(perfilService.obtenerPerfil()).rejects.toThrow('No autorizado');
});

it('editarPerfil_lanza_error_si_409_nombreUsuario_duplicado', async () => {
  mockApiClient.put.mockRejectedValue(new Error('El nombre de usuario ya está en uso'));
  await expect(
    perfilService.editarPerfil({ nombreUsuario: 'existente' })
  ).rejects.toThrow('El nombre de usuario ya está en uso');
});

it('eliminarCuenta_lanza_error_si_400_sin_confirmar', async () => {
  mockApiClient.delete.mockRejectedValue(new Error('Confirmación requerida'));
  await expect(perfilService.eliminarCuenta()).rejects.toThrow('Confirmación requerida');
});

it('cerrarSesion_lanza_error_si_falla_red', async () => {
  mockApiClient.post.mockRejectedValue(new Error('Sin conexión. Comprueba tu red e inténtalo de nuevo.'));
  await expect(perfilService.cerrarSesion()).rejects.toThrow('Sin conexión');
});
