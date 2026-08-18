import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { ItemCarritoCard } from '@/components/carrito/ItemCarritoCard';
import { ItemCarrito } from '@/services/carritoService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

// GestureDetector se sustituye por un passthrough y Gesture.Pan() se sustituye por un
// builder falso que expone los callbacks onUpdate/onEnd tal cual los define el
// componente, permitiendo disparar el gesto directamente sin simular touches nativos.
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

// useSharedValue usa useRef para persistir su valor entre renders (igual que el real),
// a diferencia del mock oficial de reanimated que crea un valor nuevo en cada render.
// Así podemos forzar un rerender tras mutar translateX y comprobar el estilo recalculado.
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

const mockItem = (overrides: Partial<ItemCarrito> = {}): ItemCarrito => ({
  id: 'item-1',
  usuarioId: 'user-1',
  nombre: 'Leche',
  cantidad: 2,
  unidad: 'litros',
  prioridad: 'media',
  estado: 'pendiente',
  noVolver: false,
  productoEnDespensa: false,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
  ...overrides,
});

const opacidadDe = (props: any) => StyleSheet.flatten(props.style).opacity ?? 0;

beforeEach(() => {
  mockLastPanGesture = undefined;
});

it('swipe_derecha_llama_aceptarItem_de_forma_optimista', () => {
  const onAceptar = jest.fn();
  const onRechazar = jest.fn();
  render(<ItemCarritoCard item={mockItem()} onAceptar={onAceptar} onRechazar={onRechazar} />);

  act(() => {
    mockLastPanGesture._onEnd({ translationX: 120 });
  });

  expect(onAceptar).toHaveBeenCalledTimes(1);
  expect(onRechazar).not.toHaveBeenCalled();
});

it('swipe_izquierda_llama_rechazarItem_de_forma_optimista', () => {
  const onAceptar = jest.fn();
  const onRechazar = jest.fn();
  render(<ItemCarritoCard item={mockItem()} onAceptar={onAceptar} onRechazar={onRechazar} />);

  act(() => {
    mockLastPanGesture._onEnd({ translationX: -120 });
  });

  expect(onRechazar).toHaveBeenCalledTimes(1);
  expect(onAceptar).not.toHaveBeenCalled();
});

it('swipe_corto_no_activa_accion', () => {
  const onAceptar = jest.fn();
  const onRechazar = jest.fn();
  render(<ItemCarritoCard item={mockItem()} onAceptar={onAceptar} onRechazar={onRechazar} />);

  act(() => {
    mockLastPanGesture._onEnd({ translationX: 50 });
  });

  expect(onAceptar).not.toHaveBeenCalled();
  expect(onRechazar).not.toHaveBeenCalled();
});

it('overlay_verde_visible_durante_swipe_derecha', () => {
  const { getByTestId, rerender } = render(
    <ItemCarritoCard item={mockItem()} onAceptar={jest.fn()} onRechazar={jest.fn()} />
  );

  act(() => {
    mockLastPanGesture._onUpdate({ translationX: 60 });
    rerender(<ItemCarritoCard item={mockItem()} onAceptar={jest.fn()} onRechazar={jest.fn()} />);
  });

  expect(opacidadDe(getByTestId('overlay-aceptar-carrito').props)).toBeGreaterThan(0);
  expect(opacidadDe(getByTestId('overlay-rechazar-carrito').props)).toBe(0);
});

it('overlay_rojo_visible_durante_swipe_izquierda', () => {
  const { getByTestId, rerender } = render(
    <ItemCarritoCard item={mockItem()} onAceptar={jest.fn()} onRechazar={jest.fn()} />
  );

  act(() => {
    mockLastPanGesture._onUpdate({ translationX: -60 });
    rerender(<ItemCarritoCard item={mockItem()} onAceptar={jest.fn()} onRechazar={jest.fn()} />);
  });

  expect(opacidadDe(getByTestId('overlay-rechazar-carrito').props)).toBeGreaterThan(0);
  expect(opacidadDe(getByTestId('overlay-aceptar-carrito').props)).toBe(0);
});

it('swipe_derecha_ignorado_si_item_ya_aceptado', () => {
  const onAceptar = jest.fn();
  const onRechazar = jest.fn();
  render(
    <ItemCarritoCard
      item={mockItem({ estado: 'aceptado' })}
      onAceptar={onAceptar}
      onRechazar={onRechazar}
    />
  );

  act(() => {
    mockLastPanGesture._onEnd({ translationX: 120 });
  });

  expect(onAceptar).not.toHaveBeenCalled();
});

it('swipe_izquierda_ignorado_si_item_ya_rechazado', () => {
  const onAceptar = jest.fn();
  const onRechazar = jest.fn();
  render(
    <ItemCarritoCard
      item={mockItem({ estado: 'rechazado' })}
      onAceptar={onAceptar}
      onRechazar={onRechazar}
    />
  );

  act(() => {
    mockLastPanGesture._onEnd({ translationX: -120 });
  });

  expect(onRechazar).not.toHaveBeenCalled();
});
