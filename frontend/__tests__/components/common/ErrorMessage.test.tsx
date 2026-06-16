import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorMessage } from '@/components/common/ErrorMessage';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

it('no_renderiza_cuando_visible_es_false', () => {
  const { queryByTestId } = render(<ErrorMessage mensaje="Error" visible={false} />);
  expect(queryByTestId('error-message')).toBeNull();
});

it('renderiza_mensaje_cuando_visible_es_true', () => {
  const { getByTestId } = render(<ErrorMessage mensaje="Campo requerido" visible={true} />);
  expect(getByTestId('error-message')).toBeTruthy();
});

it('muestra_icono_warning', () => {
  const { getByTestId } = render(<ErrorMessage mensaje="Error" visible={true} />);
  expect(getByTestId('warning-icon')).toBeTruthy();
});
