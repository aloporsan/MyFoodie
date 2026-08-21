import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { NotificacionesScreen } from '@/screens/notificaciones/NotificacionesScreen';
import { notificacionService } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  router: { push: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/notificacionService');

// NotificacionItem usa Gesture.Pan/reanimated; se sustituyen por passthroughs simples
// porque aquí solo se prueba el agrupado y las acciones de la pantalla, no el swipe.
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: any) => children,
  Gesture: { Pan: () => ({ activeOffsetX: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }) }) },
}));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (init: number) => ({ value: init }),
    useAnimatedStyle: (factory: () => any) => factory(),
    withTiming: (toValue: number) => toValue,
    withSpring: (toValue: number) => toValue,
    runOnJS: (fn: any) => fn,
  };
});

const mockService = notificacionService as jest.Mocked<typeof notificacionService>;

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

const mockNotificacion = (overrides: Partial<any> = {}) => ({
  id: 'notif-1',
  tipo: 'nuevo_seguidor',
  emisor: { id: 'emisor-1', nombre: 'Ana Pérez', nombreUsuario: 'anap', fotoPerfil: null },
  titulo: 'Ana Pérez te ha seguido',
  cuerpo: 'Ana Pérez ha empezado a seguirte',
  leida: false,
  referenciaId: 'seg-1',
  referenciaType: 'seguimiento',
  createdAt: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useNotificacionStore.setState({ ...estadoInicial });
  mockService.obtenerNotificaciones.mockResolvedValue([]);
  mockService.obtenerContador.mockResolvedValue(0);
});

it('muestra_el_estado_vacio_si_no_hay_notificaciones', async () => {
  const { getByText } = render(<NotificacionesScreen />);
  await waitFor(() => expect(getByText('No tienes notificaciones')).toBeTruthy());
});

it('agrupa_las_notificaciones_de_hoy_bajo_el_encabezado_Hoy', async () => {
  mockService.obtenerNotificaciones.mockResolvedValue([mockNotificacion()]);

  const { getByText } = render(<NotificacionesScreen />);

  await waitFor(() => expect(getByText('Hoy')).toBeTruthy());
  expect(getByText('Ana Pérez te ha seguido')).toBeTruthy();
});

it('agrupa_una_notificacion_de_hace_10_dias_bajo_Anteriores', async () => {
  const antigua = mockNotificacion({
    id: 'notif-vieja',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  });
  mockService.obtenerNotificaciones.mockResolvedValue([antigua]);

  const { getByText } = render(<NotificacionesScreen />);

  await waitFor(() => expect(getByText('Anteriores')).toBeTruthy());
});

it('muestra_boton_marcar_todas_solo_si_hay_no_leidas', async () => {
  // El contador se carga de forma asíncrona al montar (cargarContador), así que se
  // fija en el mock del servicio en vez de en el estado inicial del store.
  mockService.obtenerContador.mockResolvedValue(3);

  const { getByText } = render(<NotificacionesScreen />);

  await waitFor(() => expect(getByText('Marcar todas')).toBeTruthy());
});

it('no_muestra_boton_marcar_todas_si_no_hay_no_leidas', async () => {
  useNotificacionStore.setState({ ...estadoInicial, contadorNoLeidas: 0 });

  const { queryByText } = render(<NotificacionesScreen />);

  await waitFor(() => expect(mockService.obtenerNotificaciones).toHaveBeenCalled());
  expect(queryByText('Marcar todas')).toBeNull();
});

it('pulsar_marcar_todas_llama_al_servicio_correspondiente', async () => {
  mockService.marcarTodasComoLeidas.mockResolvedValue(undefined);
  mockService.obtenerContador.mockResolvedValue(2);

  const { getByText } = render(<NotificacionesScreen />);
  await waitFor(() => expect(getByText('Marcar todas')).toBeTruthy());

  await act(async () => {
    fireEvent.press(getByText('Marcar todas'));
  });

  expect(mockService.marcarTodasComoLeidas).toHaveBeenCalled();
});
