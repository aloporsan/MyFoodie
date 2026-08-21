import { notificacionService } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';

jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/notificacionService');

const mockService = notificacionService as jest.Mocked<typeof notificacionService>;

const mockNotificacion = (overrides: Partial<any> = {}) => ({
  id: 'notif-1',
  tipo: 'nuevo_seguidor',
  emisor: { id: 'emisor-1', nombre: 'Ana Pérez', nombreUsuario: 'anap', fotoPerfil: null },
  titulo: 'Ana Pérez te ha seguido',
  cuerpo: 'Ana Pérez ha empezado a seguirte',
  leida: false,
  referenciaId: 'seg-1',
  referenciaType: 'seguimiento',
  createdAt: '2026-01-01T10:00:00',
  ...overrides,
});

const mockPreferencias = {
  notificarNuevoSeguidor: true,
  notificarSolicitudSeguimiento: true,
  notificarLikes: true,
  notificarComentarios: true,
  notificarRecetasCompartidas: true,
  notificarCaducidades: true,
  notificarCarrito: true,
};

const estadoInicial = {
  notificaciones: [],
  pagina: 0,
  hayMas: false,
  contadorNoLeidas: 0,
  preferenciasNotificacion: null,
  isLoading: false,
  isLoadingMas: false,
  error: null,
};

beforeEach(() => {
  useNotificacionStore.setState({ ...estadoInicial });
  jest.clearAllMocks();
});

// -------------------------------------------------------------------------
// cargarNotificaciones / cargarMas
// -------------------------------------------------------------------------

it('cargarNotificaciones_actualiza_la_lista_y_hayMas_segun_el_tamaño_de_pagina', async () => {
  mockService.obtenerNotificaciones.mockResolvedValue(Array.from({ length: 20 }, (_, i) => mockNotificacion({ id: `n${i}` })));

  await useNotificacionStore.getState().cargarNotificaciones();

  expect(useNotificacionStore.getState().notificaciones).toHaveLength(20);
  expect(useNotificacionStore.getState().hayMas).toBe(true);
  expect(useNotificacionStore.getState().pagina).toBe(0);
});

it('cargarNotificaciones_marca_hayMas_false_si_la_pagina_viene_incompleta', async () => {
  mockService.obtenerNotificaciones.mockResolvedValue([mockNotificacion()]);

  await useNotificacionStore.getState().cargarNotificaciones();

  expect(useNotificacionStore.getState().hayMas).toBe(false);
});

it('cargarNotificaciones_guarda_el_error_si_falla_el_servicio', async () => {
  mockService.obtenerNotificaciones.mockRejectedValue(new Error('Error de red'));

  await useNotificacionStore.getState().cargarNotificaciones();

  expect(useNotificacionStore.getState().error).toBe('Error de red');
  expect(useNotificacionStore.getState().isLoading).toBe(false);
});

it('cargarMas_añade_la_siguiente_pagina_al_final_de_la_lista', async () => {
  useNotificacionStore.setState({ ...estadoInicial, notificaciones: [mockNotificacion({ id: 'n0' })], hayMas: true, pagina: 0 });
  mockService.obtenerNotificaciones.mockResolvedValue([mockNotificacion({ id: 'n1' })]);

  await useNotificacionStore.getState().cargarMas();

  expect(useNotificacionStore.getState().notificaciones.map((n) => n.id)).toEqual(['n0', 'n1']);
  expect(useNotificacionStore.getState().pagina).toBe(1);
  expect(mockService.obtenerNotificaciones).toHaveBeenCalledWith(1, 20);
});

it('cargarMas_no_hace_nada_si_no_hayMas', async () => {
  useNotificacionStore.setState({ ...estadoInicial, hayMas: false });

  await useNotificacionStore.getState().cargarMas();

  expect(mockService.obtenerNotificaciones).not.toHaveBeenCalled();
});

// -------------------------------------------------------------------------
// cargarContador
// -------------------------------------------------------------------------

it('cargarContador_actualiza_contadorNoLeidas', async () => {
  mockService.obtenerContador.mockResolvedValue(3);

  await useNotificacionStore.getState().cargarContador();

  expect(useNotificacionStore.getState().contadorNoLeidas).toBe(3);
});

// -------------------------------------------------------------------------
// marcarComoLeida / marcarTodasComoLeidas
// -------------------------------------------------------------------------

it('marcarComoLeida_marca_la_notificacion_y_refresca_el_contador', async () => {
  useNotificacionStore.setState({ ...estadoInicial, notificaciones: [mockNotificacion()] });
  mockService.marcarComoLeida.mockResolvedValue(undefined);
  mockService.obtenerContador.mockResolvedValue(0);

  await useNotificacionStore.getState().marcarComoLeida('notif-1');

  expect(useNotificacionStore.getState().notificaciones[0].leida).toBe(true);
  expect(useNotificacionStore.getState().contadorNoLeidas).toBe(0);
});

it('marcarComoLeida_propaga_el_error_si_falla', async () => {
  useNotificacionStore.setState({ ...estadoInicial, notificaciones: [mockNotificacion()] });
  mockService.marcarComoLeida.mockRejectedValue(new Error('Error de red'));

  await expect(useNotificacionStore.getState().marcarComoLeida('notif-1')).rejects.toThrow();
  expect(useNotificacionStore.getState().error).toBe('Error de red');
});

it('marcarTodasComoLeidas_marca_todas_y_resetea_el_contador', async () => {
  useNotificacionStore.setState({
    ...estadoInicial,
    notificaciones: [mockNotificacion({ id: 'n1' }), mockNotificacion({ id: 'n2' })],
    contadorNoLeidas: 2,
  });
  mockService.marcarTodasComoLeidas.mockResolvedValue(undefined);

  await useNotificacionStore.getState().marcarTodasComoLeidas();

  expect(useNotificacionStore.getState().notificaciones.every((n) => n.leida)).toBe(true);
  expect(useNotificacionStore.getState().contadorNoLeidas).toBe(0);
});

// -------------------------------------------------------------------------
// eliminarNotificacion — actualización optimista con rollback
// -------------------------------------------------------------------------

it('eliminarNotificacion_quita_la_notificacion_de_forma_inmediata_sin_esperar_la_red', () => {
  useNotificacionStore.setState({ ...estadoInicial, notificaciones: [mockNotificacion()], contadorNoLeidas: 1 });
  mockService.eliminarNotificacion.mockReturnValue(new Promise(() => {})); // nunca se resuelve en el test

  useNotificacionStore.getState().eliminarNotificacion('notif-1');

  // El estado ya refleja el borrado sin esperar la respuesta del backend.
  expect(useNotificacionStore.getState().notificaciones).toHaveLength(0);
  expect(useNotificacionStore.getState().contadorNoLeidas).toBe(0);
});

it('eliminarNotificacion_no_descuenta_el_contador_si_la_notificacion_ya_estaba_leida', () => {
  useNotificacionStore.setState({
    ...estadoInicial,
    notificaciones: [mockNotificacion({ leida: true })],
    contadorNoLeidas: 0,
  });
  mockService.eliminarNotificacion.mockReturnValue(new Promise(() => {}));

  useNotificacionStore.getState().eliminarNotificacion('notif-1');

  expect(useNotificacionStore.getState().contadorNoLeidas).toBe(0);
});

it('eliminarNotificacion_revierte_el_cambio_optimista_si_falla_la_peticion', async () => {
  const notificacion = mockNotificacion();
  useNotificacionStore.setState({ ...estadoInicial, notificaciones: [notificacion], contadorNoLeidas: 1 });
  mockService.eliminarNotificacion.mockRejectedValue(new Error('Error de red'));

  useNotificacionStore.getState().eliminarNotificacion('notif-1');
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(useNotificacionStore.getState().notificaciones).toHaveLength(1);
  expect(useNotificacionStore.getState().contadorNoLeidas).toBe(1);
  expect(useNotificacionStore.getState().error).toBe('Error de red');
});

it('eliminarNotificacion_no_hace_nada_si_el_id_no_existe_en_la_lista', () => {
  useNotificacionStore.setState({ ...estadoInicial, notificaciones: [mockNotificacion()], contadorNoLeidas: 1 });

  useNotificacionStore.getState().eliminarNotificacion('id-inexistente');

  expect(useNotificacionStore.getState().notificaciones).toHaveLength(1);
  expect(mockService.eliminarNotificacion).not.toHaveBeenCalled();
});

// -------------------------------------------------------------------------
// registrarPushToken
// -------------------------------------------------------------------------

it('registrarPushToken_llama_al_servicio_con_el_token', async () => {
  mockService.registrarPushToken.mockResolvedValue(undefined);

  await useNotificacionStore.getState().registrarPushToken('token-123');

  expect(mockService.registrarPushToken).toHaveBeenCalledWith('token-123');
});

// -------------------------------------------------------------------------
// preferenciasNotificacion
// -------------------------------------------------------------------------

it('cargarPreferenciasNotificacion_actualiza_preferenciasNotificacion', async () => {
  mockService.obtenerPreferencias.mockResolvedValue(mockPreferencias);

  await useNotificacionStore.getState().cargarPreferenciasNotificacion();

  expect(useNotificacionStore.getState().preferenciasNotificacion).toEqual(mockPreferencias);
});

it('actualizarPreferenciasNotificacion_actualiza_el_estado_con_la_respuesta', async () => {
  useNotificacionStore.setState({ ...estadoInicial, preferenciasNotificacion: mockPreferencias });
  mockService.actualizarPreferencias.mockResolvedValue({ ...mockPreferencias, notificarLikes: false });

  await useNotificacionStore.getState().actualizarPreferenciasNotificacion({ notificarLikes: false });

  expect(useNotificacionStore.getState().preferenciasNotificacion?.notificarLikes).toBe(false);
});

it('actualizarPreferenciasNotificacion_propaga_el_error_si_falla', async () => {
  mockService.actualizarPreferencias.mockRejectedValue(new Error('Error de red'));

  await expect(useNotificacionStore.getState().actualizarPreferenciasNotificacion({ notificarLikes: false }))
    .rejects.toThrow();
  expect(useNotificacionStore.getState().error).toBe('Error de red');
});

// -------------------------------------------------------------------------
// clearError / reset
// -------------------------------------------------------------------------

it('clearError_limpia_el_error', () => {
  useNotificacionStore.setState({ ...estadoInicial, error: 'algo falló' });
  useNotificacionStore.getState().clearError();
  expect(useNotificacionStore.getState().error).toBeNull();
});

it('reset_restaura_el_estado_inicial', () => {
  useNotificacionStore.setState({ ...estadoInicial, notificaciones: [mockNotificacion()], contadorNoLeidas: 5 });
  useNotificacionStore.getState().reset();
  expect(useNotificacionStore.getState()).toMatchObject(estadoInicial);
});
