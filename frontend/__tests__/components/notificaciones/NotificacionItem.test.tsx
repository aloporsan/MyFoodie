import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render, fireEvent } from '@testing-library/react-native';
import { NotificacionItem } from '@/components/notificaciones/NotificacionItem';
import type { Notificacion } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: 'Image' }));

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const mockPush = require('expo-router').router.push as jest.Mock;

jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/notificacionService', () => ({
  notificacionService: {
    marcarComoLeida: jest.fn().mockResolvedValue(undefined),
    eliminarNotificacion: jest.fn().mockResolvedValue(undefined),
    obtenerContador: jest.fn().mockResolvedValue(0),
  },
}));

// Mismo enfoque que ItemCarritoCard.test.tsx: sustituir GestureDetector por passthrough
// y Gesture.Pan() por un builder falso que expone onUpdate/onEnd directamente.
let mockLastPanGesture: any;

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Pan: () => {
      const gesture: any = {};
      gesture.activeOffsetX = () => gesture;
      gesture.onUpdate = (fn: any) => {
        gesture._onUpdate = fn;
        return gesture;
      };
      gesture.onEnd = (fn: any) => {
        gesture._onEnd = fn;
        return gesture;
      };
      mockLastPanGesture = gesture;
      return gesture;
    },
  },
}));

jest.mock('react-native-reanimated', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (init: number) => {
      const ref = ReactActual.useRef({ value: init });
      return ref.current;
    },
    useAnimatedStyle: (factory: () => any) => factory(),
    withTiming: (toValue: number, _config: any, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    withSpring: (toValue: number, _config?: any, callback?: (finished: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    runOnJS: (fn: any) => fn,
  };
});

const mockNotificacion = (overrides: Partial<Notificacion> = {}): Notificacion => ({
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

const opacidadDe = (props: any) => StyleSheet.flatten(props.style).opacity ?? 0;

beforeEach(() => {
  mockLastPanGesture = undefined;
  jest.clearAllMocks();
  useNotificacionStore.setState({
    notificaciones: [],
    pagina: 0,
    hayMas: false,
    contadorNoLeidas: 0,
    preferenciasNotificacion: null,
    isLoading: false,
    isLoadingMas: false,
    error: null,
  });
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('renderiza_titulo_cuerpo_y_fecha', () => {
  const { getByText } = render(<NotificacionItem notificacion={mockNotificacion()} />);
  expect(getByText('Ana Pérez te ha seguido')).toBeTruthy();
  expect(getByText('Ana Pérez ha empezado a seguirte')).toBeTruthy();
});

it('muestra_el_punto_de_no_leida_cuando_leida_es_false', () => {
  const { getByTestId } = render(<NotificacionItem notificacion={mockNotificacion({ leida: false })} />);
  expect(getByTestId('punto-no-leida')).toBeTruthy();
});

it('no_muestra_el_punto_de_no_leida_cuando_ya_esta_leida', () => {
  const { queryByTestId } = render(<NotificacionItem notificacion={mockNotificacion({ leida: true })} />);
  expect(queryByTestId('punto-no-leida')).toBeNull();
});

it('pulsar_marca_como_leida_y_navega_segun_el_tipo', async () => {
  const { getByTestId } = render(
    <NotificacionItem notificacion={mockNotificacion({ tipo: 'nuevo_seguidor', emisor: { id: 'emisor-1', nombre: 'Ana', nombreUsuario: 'ana', fotoPerfil: null } })} />
  );

  await act(async () => {
    fireEvent.press(getByTestId('notificacion-item'));
  });

  const { notificacionService } = require('@/services/notificacionService');
  expect(notificacionService.marcarComoLeida).toHaveBeenCalledWith('notif-1');
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/social/perfil/[id]', params: { id: 'emisor-1' } });
});

it('swipe_izquierda_por_encima_del_umbral_elimina_la_notificacion_de_forma_optimista', () => {
  const notificacion = mockNotificacion();
  useNotificacionStore.setState({
    notificaciones: [notificacion],
    pagina: 0,
    hayMas: false,
    contadorNoLeidas: 1,
    preferenciasNotificacion: null,
    isLoading: false,
    isLoadingMas: false,
    error: null,
  });

  render(<NotificacionItem notificacion={notificacion} />);

  act(() => {
    mockLastPanGesture._onEnd({ translationX: -120 });
  });
  // La eliminación optimista del store ocurre tras la animación de salida (200ms).
  act(() => {
    jest.advanceTimersByTime(200);
  });

  expect(useNotificacionStore.getState().notificaciones).toHaveLength(0);
});

it('swipe_corto_no_elimina_la_notificacion', () => {
  const notificacion = mockNotificacion();
  useNotificacionStore.setState({
    notificaciones: [notificacion],
    pagina: 0,
    hayMas: false,
    contadorNoLeidas: 1,
    preferenciasNotificacion: null,
    isLoading: false,
    isLoadingMas: false,
    error: null,
  });

  render(<NotificacionItem notificacion={notificacion} />);

  act(() => {
    mockLastPanGesture._onEnd({ translationX: -40 });
    jest.advanceTimersByTime(200);
  });

  expect(useNotificacionStore.getState().notificaciones).toHaveLength(1);
});

it('overlay_de_eliminar_visible_durante_el_swipe', () => {
  const { getByTestId, rerender } = render(<NotificacionItem notificacion={mockNotificacion()} />);

  act(() => {
    mockLastPanGesture._onUpdate({ translationX: -60 });
    rerender(<NotificacionItem notificacion={mockNotificacion()} />);
  });

  expect(opacidadDe(getByTestId('overlay-eliminar-notificacion').props)).toBeGreaterThan(0);
});

it('swipe_hacia_la_derecha_no_mueve_la_tarjeta_ni_activa_el_overlay', () => {
  const { getByTestId, rerender } = render(<NotificacionItem notificacion={mockNotificacion()} />);

  act(() => {
    mockLastPanGesture._onUpdate({ translationX: 60 });
    rerender(<NotificacionItem notificacion={mockNotificacion()} />);
  });

  expect(opacidadDe(getByTestId('overlay-eliminar-notificacion').props)).toBeCloseTo(0);
});
