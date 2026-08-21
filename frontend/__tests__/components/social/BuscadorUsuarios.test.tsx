import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BuscadorUsuarios } from '@/components/social/BuscadorUsuarios';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onBuscar = jest.fn();
const onLimpiar = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('renderiza_input_vacio_por_defecto', () => {
  const { getByTestId } = render(
    <BuscadorUsuarios value="" onBuscar={onBuscar} onLimpiar={onLimpiar} />
  );
  expect(getByTestId('input-buscar-usuarios').props.value).toBe('');
});

it('llama_onBuscar_tras_debounce', () => {
  const { getByTestId } = render(
    <BuscadorUsuarios value="" onBuscar={onBuscar} onLimpiar={onLimpiar} />
  );
  fireEvent.changeText(getByTestId('input-buscar-usuarios'), 'ana');
  expect(onBuscar).not.toHaveBeenCalled();
  jest.advanceTimersByTime(300);
  expect(onBuscar).toHaveBeenCalledWith('ana');
});

it('no_llama_onBuscar_antes_del_debounce', () => {
  const { getByTestId } = render(
    <BuscadorUsuarios value="" onBuscar={onBuscar} onLimpiar={onLimpiar} />
  );
  fireEvent.changeText(getByTestId('input-buscar-usuarios'), 'ana');
  jest.advanceTimersByTime(299);
  expect(onBuscar).not.toHaveBeenCalled();
});

it('llama_onLimpiar_al_pulsar_boton', () => {
  const { getByTestId } = render(
    <BuscadorUsuarios value="ana" onBuscar={onBuscar} onLimpiar={onLimpiar} />
  );
  fireEvent.press(getByTestId('btn-limpiar'));
  expect(onLimpiar).toHaveBeenCalledTimes(1);
});
