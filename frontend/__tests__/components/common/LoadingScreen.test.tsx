import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingScreen } from '@/components/common/LoadingScreen';

jest.mock('@/assets/images/logo-myfoodie.png', () => 1, { virtual: true });

it('renderiza_sin_errores', () => {
  expect(() => render(<LoadingScreen />)).not.toThrow();
});

it('muestra_imagen_con_testID', () => {
  const { getByTestId } = render(<LoadingScreen />);
  expect(getByTestId('loading-screen-logo')).toBeTruthy();
});
