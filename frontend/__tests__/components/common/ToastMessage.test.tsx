import React from 'react';
import { act, render } from '@testing-library/react-native';
import { ToastMessage } from '@/components/common/ToastMessage';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('no_renderiza_cuando_visible_es_false', () => {
  const { queryByTestId } = render(
    <ToastMessage tipo="success" mensaje="OK" visible={false} />
  );
  expect(queryByTestId('toast-container')).toBeNull();
});

it('renderiza_mensaje_cuando_visible_es_true', () => {
  const { getByTestId } = render(
    <ToastMessage tipo="success" mensaje="Guardado" visible={true} />
  );
  expect(getByTestId('toast-container')).toBeTruthy();
  expect(getByTestId('toast-mensaje')).toBeTruthy();
});

it('aplica_color_verde_para_success', () => {
  const { getByTestId } = render(
    <ToastMessage tipo="success" mensaje="OK" visible={true} />
  );
  const container = getByTestId('toast-container');
  expect(container.props.style).toEqual(
    expect.objectContaining({ backgroundColor: '#7FC62A' })
  );
});

it('aplica_color_rojo_para_error', () => {
  const { getByTestId } = render(
    <ToastMessage tipo="error" mensaje="Error" visible={true} />
  );
  const container = getByTestId('toast-container');
  expect(container.props.style).toEqual(
    expect.objectContaining({ backgroundColor: '#E53935' })
  );
});

it('llama_onDismiss_despues_de_3_segundos', () => {
  const onDismiss = jest.fn();
  render(
    <ToastMessage tipo="success" mensaje="OK" visible={true} onDismiss={onDismiss} />
  );
  act(() => {
    jest.runAllTimers();
  });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
