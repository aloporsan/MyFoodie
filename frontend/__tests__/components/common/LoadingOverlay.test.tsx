import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';

it('no_renderiza_cuando_visible_es_false', () => {
  const { queryByTestId } = render(<LoadingOverlay visible={false} />);
  expect(queryByTestId('loading-overlay')).toBeNull();
});

it('renderiza_overlay_cuando_visible_es_true', () => {
  const { getByTestId } = render(<LoadingOverlay visible={true} />);
  expect(getByTestId('loading-overlay')).toBeTruthy();
});

it('muestra_spinner_verde', () => {
  const { getByTestId } = render(<LoadingOverlay visible={true} />);
  expect(getByTestId('loading-spinner')).toBeTruthy();
});

it('muestra_mensaje_opcional', () => {
  const { getByTestId } = render(<LoadingOverlay visible={true} mensaje="Guardando..." />);
  expect(getByTestId('loading-mensaje')).toBeTruthy();
});
