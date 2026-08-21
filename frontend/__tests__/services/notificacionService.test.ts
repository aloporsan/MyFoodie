import { apiClient } from '@/services/apiClient';
import { notificacionService } from '@/services/notificacionService';

jest.mock('@/services/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
  setTokenGetter: jest.fn(),
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const mockNotificacion = {
  id: 'notif-1',
  tipo: 'nuevo_seguidor',
  emisor: { id: 'emisor-1', nombre: 'Ana Pérez', nombreUsuario: 'anap', fotoPerfil: null },
  titulo: 'Ana Pérez te ha seguido',
  cuerpo: 'Ana Pérez ha empezado a seguirte',
  leida: false,
  referenciaId: 'seg-1',
  referenciaType: 'seguimiento',
  createdAt: '2026-01-01T10:00:00',
};

const mockPreferencias = {
  notificarNuevoSeguidor: true,
  notificarSolicitudSeguimiento: true,
  notificarLikes: true,
  notificarComentarios: true,
  notificarRecetasCompartidas: true,
  notificarCaducidades: true,
  notificarCarrito: true,
};

beforeEach(() => jest.clearAllMocks());

it('obtenerNotificaciones_llama_al_endpoint_con_pagina_y_tamaño_por_defecto', async () => {
  mockGet.mockResolvedValue({ data: [mockNotificacion] });
  const result = await notificacionService.obtenerNotificaciones();
  expect(result).toHaveLength(1);
  expect(mockGet).toHaveBeenCalledWith('/notificaciones', { params: { pagina: 0, tamaño: 20 } });
});

it('obtenerNotificaciones_envia_pagina_y_tamaño_explicitos', async () => {
  mockGet.mockResolvedValue({ data: [] });
  await notificacionService.obtenerNotificaciones(2, 10);
  expect(mockGet).toHaveBeenCalledWith('/notificaciones', { params: { pagina: 2, tamaño: 10 } });
});

it('obtenerContador_devuelve_el_numero_de_no_leidas', async () => {
  mockGet.mockResolvedValue({ data: { noLeidas: 5 } });
  const result = await notificacionService.obtenerContador();
  expect(result).toBe(5);
  expect(mockGet).toHaveBeenCalledWith('/notificaciones/contador');
});

it('marcarComoLeida_llama_al_endpoint_correcto', async () => {
  mockPut.mockResolvedValue({});
  await notificacionService.marcarComoLeida('notif-1');
  expect(mockPut).toHaveBeenCalledWith('/notificaciones/notif-1/leer');
});

it('marcarTodasComoLeidas_llama_al_endpoint_correcto', async () => {
  mockPut.mockResolvedValue({});
  await notificacionService.marcarTodasComoLeidas();
  expect(mockPut).toHaveBeenCalledWith('/notificaciones/leer-todas');
});

it('eliminarNotificacion_llama_al_endpoint_correcto', async () => {
  mockDelete.mockResolvedValue({});
  await notificacionService.eliminarNotificacion('notif-1');
  expect(mockDelete).toHaveBeenCalledWith('/notificaciones/notif-1');
});

it('registrarPushToken_envia_el_token_en_el_body', async () => {
  mockPost.mockResolvedValue({});
  await notificacionService.registrarPushToken('ExponentPushToken[abc123]');
  expect(mockPost).toHaveBeenCalledWith('/usuarios/push-token', { token: 'ExponentPushToken[abc123]' });
});

it('obtenerPreferencias_devuelve_las_preferencias_del_usuario', async () => {
  mockGet.mockResolvedValue({ data: mockPreferencias });
  const result = await notificacionService.obtenerPreferencias();
  expect(result.notificarLikes).toBe(true);
  expect(mockGet).toHaveBeenCalledWith('/perfil/notificaciones');
});

it('actualizarPreferencias_envia_solo_los_campos_modificados', async () => {
  mockPut.mockResolvedValue({ data: { ...mockPreferencias, notificarLikes: false } });
  const result = await notificacionService.actualizarPreferencias({ notificarLikes: false });
  expect(result.notificarLikes).toBe(false);
  expect(mockPut).toHaveBeenCalledWith('/perfil/notificaciones', { notificarLikes: false });
});

it('eliminarNotificacion_propaga_el_error_si_falla', async () => {
  mockDelete.mockRejectedValue(new Error('No tienes permiso sobre esta notificación'));
  await expect(notificacionService.eliminarNotificacion('notif-ajena'))
    .rejects.toThrow('No tienes permiso sobre esta notificación');
});
