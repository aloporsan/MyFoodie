import React from 'react';
import { render } from '@testing-library/react-native';
import { CarritoResumenCard } from '@/components/dashboard/CarritoResumenCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

it('renderiza_titulo_carrito_inteligente', () => {
  const { getByText } = render(<CarritoResumenCard />);
  expect(getByText('Carrito inteligente')).toBeTruthy();
});

it('renderiza_badge_proximamente', () => {
  const { getByText } = render(<CarritoResumenCard />);
  expect(getByText('Pronto')).toBeTruthy();
});
