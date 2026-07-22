import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrivacidadToggle } from '@/components/perfil/PrivacidadToggle';

it('renderiza_label_y_descripcion_correctamente', () => {
  const { getByText } = render(
    <PrivacidadToggle
      label="Perfil público"
      descripcion="Cualquier usuario puede ver tu perfil"
      valor={true}
      onChange={jest.fn()}
    />
  );
  expect(getByText('Perfil público')).toBeTruthy();
  expect(getByText('Cualquier usuario puede ver tu perfil')).toBeTruthy();
});

it('renderiza_switch_en_estado_correcto', () => {
  const { getByRole } = render(
    <PrivacidadToggle
      label="Mostrar recetas"
      descripcion="Tus recetas son visibles"
      valor={false}
      onChange={jest.fn()}
    />
  );
  const switchEl = getByRole('switch');
  expect(switchEl.props.value).toBe(false);
});

it('llama_onChange_al_cambiar_switch', () => {
  const onChange = jest.fn();
  const { getByRole } = render(
    <PrivacidadToggle
      label="Estadísticas"
      descripcion="Muestra tus estadísticas"
      valor={true}
      onChange={onChange}
    />
  );
  fireEvent(getByRole('switch'), 'valueChange', false);
  expect(onChange).toHaveBeenCalledWith(false);
});
