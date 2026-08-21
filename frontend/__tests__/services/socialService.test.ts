import { apiClient } from '@/services/apiClient';
import { socialService } from '@/services/socialService';

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

const mockSeguimiento = {
  id: 'seg-1',
  usuarioId: 'user-2',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  fotoPerfil: null,
  estado: 'aceptado' as const,
  fechaSeguimiento: '2026-01-15T00:00:00.000Z',
};

const mockPerfilPublico = {
  id: 'user-2',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  fotoPerfil: null,
  biografia: 'Amante de la cocina',
  numSeguidores: 10,
  numSeguidos: 5,
  numRecetas: 3,
  esSeguido: true,
  haSolicitado: false,
  estaBloqueado: false,
  privacidad: 'PUBLICA' as const,
};

const mockUsuarioBusqueda = {
  id: 'user-3',
  nombre: 'Bruno López',
  nombreUsuario: 'brunolopez',
  fotoPerfil: null,
  numRecetas: 2,
  esSeguido: false,
  haSolicitado: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// Positivos
// -------------------------------------------------------------------------

it('seguirUsuario_llama_post_correcto_y_devuelve_seguimiento', async () => {
  mockApiClient.post.mockResolvedValue({ data: mockSeguimiento });
  const result = await socialService.seguirUsuario('user-2');
  expect(result.estado).toBe('aceptado');
  expect(mockApiClient.post).toHaveBeenCalledWith('/social/seguir/user-2');
});

it('dejarDeSeguir_llama_delete_correcto', async () => {
  mockApiClient.delete.mockResolvedValue({ data: undefined });
  await expect(socialService.dejarDeSeguir('user-2')).resolves.toBeUndefined();
  expect(mockApiClient.delete).toHaveBeenCalledWith('/social/seguir/user-2');
});

it('aceptarSolicitud_llama_post_correcto_y_devuelve_seguimiento', async () => {
  mockApiClient.post.mockResolvedValue({ data: mockSeguimiento });
  const result = await socialService.aceptarSolicitud('user-2');
  expect(result.estado).toBe('aceptado');
  expect(mockApiClient.post).toHaveBeenCalledWith('/social/solicitudes/user-2/aceptar');
});

it('rechazarSolicitud_llama_post_correcto', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });
  await expect(socialService.rechazarSolicitud('user-2')).resolves.toBeUndefined();
  expect(mockApiClient.post).toHaveBeenCalledWith('/social/solicitudes/user-2/rechazar');
});

it('obtenerSeguidores_sin_usuarioId_llama_ruta_propia', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockSeguimiento] });
  const result = await socialService.obtenerSeguidores();
  expect(result).toHaveLength(1);
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/seguidores');
});

it('obtenerSeguidores_con_usuarioId_llama_ruta_de_otro_usuario', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockSeguimiento] });
  await socialService.obtenerSeguidores('user-9');
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/seguidores/user-9');
});

it('obtenerSeguidos_sin_usuarioId_llama_ruta_propia', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockSeguimiento] });
  await socialService.obtenerSeguidos();
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/seguidos');
});

it('obtenerSeguidos_con_usuarioId_llama_ruta_de_otro_usuario', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockSeguimiento] });
  await socialService.obtenerSeguidos('user-9');
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/seguidos/user-9');
});

it('obtenerSolicitudes_devuelve_lista_de_solicitudes', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockSeguimiento] });
  const result = await socialService.obtenerSolicitudes();
  expect(result).toHaveLength(1);
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/solicitudes');
});

it('obtenerPerfilPublico_devuelve_datos_correctos', async () => {
  mockApiClient.get.mockResolvedValue({ data: mockPerfilPublico });
  const result = await socialService.obtenerPerfilPublico('user-2');
  expect(result.nombreUsuario).toBe('anagarcia');
  expect(result.privacidad).toBe('PUBLICA');
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/perfil/user-2');
});

it('buscarUsuarios_envia_query_param_q', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockUsuarioBusqueda] });
  const result = await socialService.buscarUsuarios('bruno');
  expect(result).toHaveLength(1);
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/buscar', { params: { q: 'bruno' } });
});

it('bloquearUsuario_llama_post_correcto', async () => {
  mockApiClient.post.mockResolvedValue({ data: undefined });
  await expect(socialService.bloquearUsuario('user-2')).resolves.toBeUndefined();
  expect(mockApiClient.post).toHaveBeenCalledWith('/social/bloquear/user-2');
});

it('desbloquearUsuario_llama_delete_correcto', async () => {
  mockApiClient.delete.mockResolvedValue({ data: undefined });
  await expect(socialService.desbloquearUsuario('user-2')).resolves.toBeUndefined();
  expect(mockApiClient.delete).toHaveBeenCalledWith('/social/bloquear/user-2');
});

it('obtenerBloqueados_devuelve_lista_de_usuarios', async () => {
  mockApiClient.get.mockResolvedValue({ data: [mockUsuarioBusqueda] });
  const result = await socialService.obtenerBloqueados();
  expect(result).toHaveLength(1);
  expect(mockApiClient.get).toHaveBeenCalledWith('/social/bloqueados');
});

// -------------------------------------------------------------------------
// Negativos
// -------------------------------------------------------------------------

it('seguirUsuario_lanza_error_si_409_ya_sigue', async () => {
  mockApiClient.post.mockRejectedValue(new Error('Ya sigues a este usuario'));
  await expect(socialService.seguirUsuario('user-2')).rejects.toThrow('Ya sigues a este usuario');
});

it('obtenerPerfilPublico_lanza_error_si_403_bloqueado', async () => {
  mockApiClient.get.mockRejectedValue(new Error('No puedes ver este perfil'));
  await expect(socialService.obtenerPerfilPublico('user-2')).rejects.toThrow('No puedes ver este perfil');
});

it('bloquearUsuario_lanza_error_si_400_se_bloquea_a_si_mismo', async () => {
  mockApiClient.post.mockRejectedValue(new Error('No puedes bloquearte a ti mismo'));
  await expect(socialService.bloquearUsuario('user-1')).rejects.toThrow('No puedes bloquearte a ti mismo');
});
