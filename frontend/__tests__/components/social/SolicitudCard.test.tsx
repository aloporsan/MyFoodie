import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SolicitudCard, SolicitudCardData } from '@/components/social/SolicitudCard';

const solicitudBase: SolicitudCardData = {
  id: 'seg-1',
  usuarioId: 'user-2',
  nombre: 'Bruno López',
  nombreUsuario: 'brunolopez',
  fotoPerfil: null,
};

const onAceptar = jest.fn();
const onRechazar = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('renderiza_nombre_y_foto_del_solicitante', () => {
  const { getByText } = render(
    <SolicitudCard solicitud={solicitudBase} onAceptar={onAceptar} onRechazar={onRechazar} />
  );
  expect(getByText('Bruno López')).toBeTruthy();
  expect(getByText('@brunolopez')).toBeTruthy();
});

it('llama_onAceptar_al_pulsar_boton_aceptar', () => {
  const { getByTestId } = render(
    <SolicitudCard solicitud={solicitudBase} onAceptar={onAceptar} onRechazar={onRechazar} />
  );
  fireEvent.press(getByTestId('btn-aceptar'));
  expect(onAceptar).toHaveBeenCalledTimes(1);
});

it('llama_onRechazar_al_pulsar_boton_rechazar', () => {
  const { getByTestId } = render(
    <SolicitudCard solicitud={solicitudBase} onAceptar={onAceptar} onRechazar={onRechazar} />
  );
  fireEvent.press(getByTestId('btn-rechazar'));
  expect(onRechazar).toHaveBeenCalledTimes(1);
});
