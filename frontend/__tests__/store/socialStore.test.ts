import { Seguimiento, UsuarioBusqueda, socialService } from '@/services/socialService';
import { useSocialStore } from '@/store/socialStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/apiClient', () => ({
  apiClient: { post: jest.fn(), get: jest.fn(), put: jest.fn(), delete: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/socialService');

const mockSocialService = socialService as jest.Mocked<typeof socialService>;

const ESTADO_INICIAL = {
  seguidores: [],
  seguidos: [],
  solicitudesPendientes: [],
  bloqueados: [],
  perfilPublico: null,
  resultadosBusqueda: [],
  isLoading: false,
  error: null,
};

function seguimiento(overrides: Partial<Seguimiento> = {}): Seguimiento {
  return {
    id: 'seg-1',
    usuarioId: 'user-2',
    nombre: 'Ana García',
    nombreUsuario: 'anagarcia',
    fotoPerfil: null,
    estado: 'aceptado',
    fechaSeguimiento: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

function usuarioBusqueda(overrides: Partial<UsuarioBusqueda> = {}): UsuarioBusqueda {
  return {
    id: 'user-2',
    nombre: 'Ana García',
    nombreUsuario: 'anagarcia',
    fotoPerfil: null,
    numRecetas: 3,
    esSeguido: false,
    haSolicitado: false,
    ...overrides,
  };
}

beforeEach(() => {
  useSocialStore.setState(ESTADO_INICIAL);
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// Positivos
// -------------------------------------------------------------------------

it('seguirUsuario_actualiza_seguidos_en_store', async () => {
  mockSocialService.seguirUsuario.mockResolvedValue(seguimiento({ estado: 'aceptado' }));

  await useSocialStore.getState().seguirUsuario('user-2');

  const { seguidos } = useSocialStore.getState();
  expect(seguidos).toHaveLength(1);
  expect(seguidos[0].usuarioId).toBe('user-2');
});

it('dejarDeSeguir_elimina_de_seguidos_en_store', async () => {
  useSocialStore.setState({ seguidos: [seguimiento({ usuarioId: 'user-2' })] });
  mockSocialService.dejarDeSeguir.mockResolvedValue(undefined);

  await useSocialStore.getState().dejarDeSeguir('user-2');

  expect(useSocialStore.getState().seguidos).toHaveLength(0);
});

it('aceptarSolicitud_mueve_de_pendientes_a_seguidores', async () => {
  useSocialStore.setState({
    solicitudesPendientes: [seguimiento({ usuarioId: 'user-2', estado: 'pendiente' })],
  });
  mockSocialService.aceptarSolicitud.mockResolvedValue(seguimiento({ usuarioId: 'user-2', estado: 'aceptado' }));

  await useSocialStore.getState().aceptarSolicitud('user-2');

  const { solicitudesPendientes, seguidores } = useSocialStore.getState();
  expect(solicitudesPendientes).toHaveLength(0);
  expect(seguidores).toHaveLength(1);
  expect(seguidores[0].estado).toBe('aceptado');
});

it('rechazarSolicitud_elimina_de_pendientes', async () => {
  useSocialStore.setState({
    solicitudesPendientes: [seguimiento({ usuarioId: 'user-2', estado: 'pendiente' })],
  });
  mockSocialService.rechazarSolicitud.mockResolvedValue(undefined);

  await useSocialStore.getState().rechazarSolicitud('user-2');

  expect(useSocialStore.getState().solicitudesPendientes).toHaveLength(0);
});

it('bloquearUsuario_añade_a_bloqueados_y_elimina_seguimiento', async () => {
  useSocialStore.setState({
    seguidores: [seguimiento({ usuarioId: 'user-2' })],
    seguidos: [seguimiento({ usuarioId: 'user-2' })],
  });
  mockSocialService.bloquearUsuario.mockResolvedValue(undefined);
  mockSocialService.obtenerBloqueados.mockResolvedValue([usuarioBusqueda({ id: 'user-2' })]);

  await useSocialStore.getState().bloquearUsuario('user-2');

  const { seguidores, seguidos, bloqueados } = useSocialStore.getState();
  expect(seguidores).toHaveLength(0);
  expect(seguidos).toHaveLength(0);
  expect(bloqueados).toHaveLength(1);
  expect(bloqueados[0].id).toBe('user-2');
});

it('buscarUsuarios_actualiza_resultadosBusqueda', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuarioBusqueda()]);

  await useSocialStore.getState().buscarUsuarios('ana');

  expect(useSocialStore.getState().resultadosBusqueda).toHaveLength(1);
  expect(mockSocialService.buscarUsuarios).toHaveBeenCalledWith('ana');
});

// -------------------------------------------------------------------------
// Negativos
// -------------------------------------------------------------------------

it('seguirUsuario_guarda_error_si_falla', async () => {
  mockSocialService.seguirUsuario.mockRejectedValue(new Error('Ya sigues a este usuario'));

  await expect(useSocialStore.getState().seguirUsuario('user-2')).rejects.toThrow();

  expect(useSocialStore.getState().error).toBe('Ya sigues a este usuario');
  expect(useSocialStore.getState().seguidos).toHaveLength(0);
});

it('bloquearUsuario_no_modifica_store_si_falla', async () => {
  useSocialStore.setState({ seguidores: [seguimiento({ usuarioId: 'user-2' })] });
  mockSocialService.bloquearUsuario.mockRejectedValue(new Error('No puedes bloquearte a ti mismo'));

  await expect(useSocialStore.getState().bloquearUsuario('user-2')).rejects.toThrow();

  expect(useSocialStore.getState().seguidores).toHaveLength(1);
  expect(mockSocialService.obtenerBloqueados).not.toHaveBeenCalled();
});
