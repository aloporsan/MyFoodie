import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BuscadorDespensa } from '@/components/despensa/BuscadorDespensa';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onSearch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('renderiza_input_con_placeholder_por_defecto', () => {
  const { getByPlaceholderText } = render(
    <BuscadorDespensa value="" onSearch={onSearch} />
  );
  expect(getByPlaceholderText('Buscar producto...')).toBeTruthy();
});

it('llama_onSearch_tras_debounce_de_300ms_al_escribir', () => {
  const { getByPlaceholderText } = render(
    <BuscadorDespensa value="" onSearch={onSearch} />
  );
  fireEvent.changeText(getByPlaceholderText('Buscar producto...'), 'leche');
  expect(onSearch).not.toHaveBeenCalled();
  jest.advanceTimersByTime(300);
  expect(onSearch).toHaveBeenCalledWith('leche');
});

it('no_llama_onSearch_antes_de_que_pasen_los_300ms', () => {
  const { getByPlaceholderText } = render(
    <BuscadorDespensa value="" onSearch={onSearch} />
  );
  fireEvent.changeText(getByPlaceholderText('Buscar producto...'), 'leche');
  jest.advanceTimersByTime(299);
  expect(onSearch).not.toHaveBeenCalled();
});

it('llama_onSearch_con_cadena_vacia_al_pulsar_limpiar', () => {
  // value="leche" inicializa el estado interno → el botón limpiar (testID="btn-limpiar") se renderiza
  const { getByTestId } = render(
    <BuscadorDespensa value="leche" onSearch={onSearch} />
  );
  fireEvent.press(getByTestId('btn-limpiar'));
  expect(onSearch).toHaveBeenCalledWith('');
});
