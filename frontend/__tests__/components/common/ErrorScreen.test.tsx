import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ErrorScreen } from '@/components/common/ErrorScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

it('renderiza_titulo_y_descripcion', () => {
  const { getByText } = render(
    <ErrorScreen titulo="Error de red" descripcion="Comprueba tu conexión" />
  );
  expect(getByText('Error de red')).toBeTruthy();
  expect(getByText('Comprueba tu conexión')).toBeTruthy();
});

it('muestra_boton_reintentar_cuando_se_pasa_onReintentar', () => {
  const { getByTestId } = render(
    <ErrorScreen titulo="Error" descripcion="Desc" onReintentar={jest.fn()} />
  );
  expect(getByTestId('btn-reintentar')).toBeTruthy();
});

it('muestra_boton_volver_cuando_se_pasa_onVolver', () => {
  const { getByTestId } = render(
    <ErrorScreen titulo="Error" descripcion="Desc" onVolver={jest.fn()} />
  );
  expect(getByTestId('btn-volver')).toBeTruthy();
});

it('llama_onReintentar_al_pulsar', () => {
  const onReintentar = jest.fn();
  const { getByTestId } = render(
    <ErrorScreen titulo="Error" descripcion="Desc" onReintentar={onReintentar} />
  );
  fireEvent.press(getByTestId('btn-reintentar'));
  expect(onReintentar).toHaveBeenCalledTimes(1);
});

it('llama_onVolver_al_pulsar', () => {
  const onVolver = jest.fn();
  const { getByTestId } = render(
    <ErrorScreen titulo="Error" descripcion="Desc" onVolver={onVolver} />
  );
  fireEvent.press(getByTestId('btn-volver'));
  expect(onVolver).toHaveBeenCalledTimes(1);
});
