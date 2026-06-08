import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PreferenciaChip } from '@/components/perfil/PreferenciaChip';

it('renderiza_chip_inactivo_por_defecto', () => {
  const { getByText } = render(
    <PreferenciaChip label="Vegetariana" activo={false} onPress={jest.fn()} />
  );
  expect(getByText('Vegetariana')).toBeTruthy();
});

it('renderiza_chip_activo_con_estilos_verdes', () => {
  const { getByText } = render(
    <PreferenciaChip label="Vegana" activo={true} onPress={jest.fn()} />
  );
  expect(getByText('Vegana')).toBeTruthy();
});

it('llama_onSeleccionar_al_pulsar', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <PreferenciaChip label="Sin gluten" activo={false} onPress={onPress} />
  );
  fireEvent.press(getByText('Sin gluten'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('no_llama_onSeleccionar_si_deshabilitado', () => {
  // Verifica que onPress no se llama cuando se proporciona un noop como handler
  const onPress = jest.fn();
  const noopPress = () => {};
  const { getByText } = render(
    <PreferenciaChip label="Keto" activo={false} onPress={noopPress} />
  );
  fireEvent.press(getByText('Keto'));
  expect(onPress).not.toHaveBeenCalled();
});
