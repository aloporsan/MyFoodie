import React from 'react';
import { render } from '@testing-library/react-native';
import { RecetasRecomendadasCard } from '@/components/dashboard/RecetasRecomendadasCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

it('renderiza_titulo_recetas_recomendadas', () => {
  const { getByText } = render(<RecetasRecomendadasCard />);
  expect(getByText('Recetas recomendadas')).toBeTruthy();
});

it('renderiza_badge_proximamente', () => {
  const { getByText } = render(<RecetasRecomendadasCard />);
  expect(getByText('Pronto')).toBeTruthy();
});
