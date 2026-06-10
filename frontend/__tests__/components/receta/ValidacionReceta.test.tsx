import React from 'react';
import { render } from '@testing-library/react-native';
import { ValidacionReceta } from '@/components/receta/ValidacionReceta';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

it('no_renderiza_nada_si_mensaje_es_null', () => {
  const { toJSON } = render(<ValidacionReceta mensaje={null} />);
  expect(toJSON()).toBeNull();
});

it('muestra_cabecera_cuando_hay_mensaje', () => {
  const { getByText } = render(<ValidacionReceta mensaje="El título es obligatorio" />);
  expect(getByText('La receta no está lista para publicar')).toBeTruthy();
});

it('muestra_el_error_como_bullet', () => {
  const { getByText } = render(<ValidacionReceta mensaje="El título es obligatorio" />);
  expect(getByText('El título es obligatorio')).toBeTruthy();
});

it('muestra_multiples_errores_separados_por_coma', () => {
  const { getByText } = render(
    <ValidacionReceta mensaje="El título es obligatorio, La descripción es obligatoria, Añade un ingrediente" />
  );
  expect(getByText('El título es obligatorio')).toBeTruthy();
  expect(getByText('La descripción es obligatoria')).toBeTruthy();
  expect(getByText('Añade un ingrediente')).toBeTruthy();
});
