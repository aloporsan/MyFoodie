import React from 'react';
import { render } from '@testing-library/react-native';
import { EstadisticaItem } from '@/components/perfil/EstadisticaItem';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

it('renderiza_icono_valor_y_etiqueta_correctamente', () => {
  const { getByText } = render(
    <EstadisticaItem icono="basket-outline" valor={42} etiqueta="Productos en despensa" />
  );
  expect(getByText('42')).toBeTruthy();
  expect(getByText('Productos en despensa')).toBeTruthy();
});

it('renderiza_valor_cero_sin_errores', () => {
  const { getByText } = render(
    <EstadisticaItem icono="book-outline" valor={0} etiqueta="Recetas publicadas" />
  );
  expect(getByText('0')).toBeTruthy();
  expect(getByText('Recetas publicadas')).toBeTruthy();
});
