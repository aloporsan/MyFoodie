import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CarritoResumenCard } from '@/components/dashboard/CarritoResumenCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

it('renderiza_titulo_carrito_inteligente', () => {
  const { getByText } = render(<CarritoResumenCard resumen={null} onPress={jest.fn()} />);
  expect(getByText('Carrito inteligente')).toBeTruthy();
});

it('muestra_mensaje_generico_sin_items_de_prioridad_alta', () => {
  const { getByText } = render(<CarritoResumenCard resumen={null} onPress={jest.fn()} />);
  expect(getByText('Sugerencias de compra basadas en tu despensa')).toBeTruthy();
});

it('muestra_numero_de_items_de_prioridad_alta', () => {
  const resumen = { totalItems: 3, itemsAlta: 2, itemsMedia: 1, itemsBaja: 0, itemsAceptados: 0 };
  const { getByText } = render(<CarritoResumenCard resumen={resumen} onPress={jest.fn()} />);
  expect(getByText('2 productos de prioridad alta')).toBeTruthy();
});

it('muestra_numero_de_items_aceptados', () => {
  const resumen = { totalItems: 3, itemsAlta: 0, itemsMedia: 1, itemsBaja: 0, itemsAceptados: 4 };
  const { getByText } = render(<CarritoResumenCard resumen={resumen} onPress={jest.fn()} />);
  expect(getByText('4 productos aceptados')).toBeTruthy();
});

it('llama_onPress_al_pulsar_la_card', () => {
  const onPress = jest.fn();
  const { getByText } = render(<CarritoResumenCard resumen={null} onPress={onPress} />);
  fireEvent.press(getByText('Carrito inteligente'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
