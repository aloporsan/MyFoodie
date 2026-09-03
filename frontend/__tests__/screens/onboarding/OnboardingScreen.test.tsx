import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { OnboardingScreen } from '@/screens/onboarding/OnboardingScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const TITULOS = [
  'Bienvenido a MyFoodie',
  'Tu despensa',
  'El feed',
  'El carrito inteligente',
  '¡Todo listo!',
];

const avanzarHasta = (getByTestId: any, veces: number) => {
  for (let i = 0; i < veces; i++) {
    fireEvent.press(getByTestId('onboarding-siguiente'));
  }
};

it('renderiza_las_5_pantallas_en_orden', () => {
  const { getAllByTestId, getByText } = render(<OnboardingScreen onFinish={jest.fn()} />);

  const slides = getAllByTestId(/^onboarding-slide-/);
  expect(slides.map((s) => s.props.testID)).toEqual([
    'onboarding-slide-bienvenida',
    'onboarding-slide-despensa',
    'onboarding-slide-feed',
    'onboarding-slide-carrito',
    'onboarding-slide-listo',
  ]);
  TITULOS.forEach((titulo) => expect(getByText(titulo)).toBeTruthy());
});

it('navega_con_boton_siguiente', () => {
  const { getByTestId } = render(<OnboardingScreen onFinish={jest.fn()} />);

  // De inicio el dot activo es el primero y el botón dice "Siguiente"
  expect(getByTestId('onboarding-dot-0')).toHaveStyle({ backgroundColor: '#7FC62A' });
  expect(getByTestId('onboarding-siguiente')).toHaveTextContent('Siguiente');

  fireEvent.press(getByTestId('onboarding-siguiente'));

  // Tras pulsar "Siguiente" avanza el dot activo
  expect(getByTestId('onboarding-dot-1')).toHaveStyle({ backgroundColor: '#7FC62A' });
  expect(getByTestId('onboarding-dot-0')).not.toHaveStyle({ backgroundColor: '#7FC62A' });
});

it('muestra_indicador_de_progreso_dots', () => {
  const { getAllByTestId } = render(<OnboardingScreen onFinish={jest.fn()} />);

  expect(getAllByTestId(/^onboarding-dot-/)).toHaveLength(5);
});

it('boton_omitir_visible_excepto_en_ultima_pantalla', () => {
  const { getByTestId, queryByTestId } = render(<OnboardingScreen onFinish={jest.fn()} />);

  // Visible en las 4 primeras
  for (let i = 0; i < 4; i++) {
    expect(queryByTestId('onboarding-omitir')).toBeTruthy();
    fireEvent.press(getByTestId('onboarding-siguiente'));
  }

  // En la última desaparece y el botón pasa a "Empezar"
  expect(queryByTestId('onboarding-omitir')).toBeNull();
  expect(getByTestId('onboarding-siguiente')).toHaveTextContent('Empezar');
});

it('en_la_ultima_pantalla_el_boton_empezar_invoca_onFinish', () => {
  const onFinish = jest.fn();
  const { getByTestId } = render(<OnboardingScreen onFinish={onFinish} />);

  avanzarHasta(getByTestId, 4);
  fireEvent.press(getByTestId('onboarding-siguiente'));

  expect(onFinish).toHaveBeenCalledTimes(1);
});

it('el_boton_omitir_invoca_onFinish', () => {
  const onFinish = jest.fn();
  const { getByTestId } = render(<OnboardingScreen onFinish={onFinish} />);

  fireEvent.press(getByTestId('onboarding-omitir'));

  expect(onFinish).toHaveBeenCalledTimes(1);
});
