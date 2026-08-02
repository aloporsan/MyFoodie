import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { UsuarioCard, UsuarioCardData } from '@/components/social/UsuarioCard';

const usuarioBase: UsuarioCardData = {
  id: 'user-1',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  fotoPerfil: null,
  numRecetas: 4,
  esSeguido: false,
  haSolicitado: false,
};

const onPress = jest.fn();
const onSeguir = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('renderiza_nombre_nombreUsuario_y_foto', () => {
  const { getByText } = render(<UsuarioCard usuario={usuarioBase} />);
  expect(getByText('Ana García')).toBeTruthy();
  expect(getByText('@anagarcia')).toBeTruthy();
});

it('boton_seguir_visible_si_no_sigue', () => {
  const { getByText } = render(<UsuarioCard usuario={usuarioBase} onSeguir={onSeguir} />);
  expect(getByText('Seguir')).toBeTruthy();
});

it('boton_siguiendo_visible_si_ya_sigue', () => {
  const { getByText } = render(
    <UsuarioCard usuario={{ ...usuarioBase, esSeguido: true }} onSeguir={onSeguir} />
  );
  expect(getByText('Siguiendo')).toBeTruthy();
});

it('boton_pendiente_visible_si_solicitud_enviada', () => {
  const { getByText } = render(
    <UsuarioCard usuario={{ ...usuarioBase, haSolicitado: true }} onSeguir={onSeguir} />
  );
  expect(getByText('Pendiente')).toBeTruthy();
});

it('llama_onSeguir_al_pulsar_boton_seguir', () => {
  const { getByTestId } = render(<UsuarioCard usuario={usuarioBase} onSeguir={onSeguir} />);
  fireEvent.press(getByTestId('btn-accion'));
  expect(onSeguir).toHaveBeenCalledTimes(1);
});

it('navega_a_PerfilPublico_al_pulsar_card', () => {
  const { getByTestId } = render(<UsuarioCard usuario={usuarioBase} onPress={onPress} />);
  fireEvent.press(getByTestId('usuario-card'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
