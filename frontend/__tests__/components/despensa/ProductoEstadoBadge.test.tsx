import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductoEstadoBadge } from '@/components/despensa/ProductoEstadoBadge';

it('renderiza_texto_Caducado_si_estado_caducado', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caducado" />);
  expect(getByText('Caducado')).toBeTruthy();
});

it('renderiza_texto_Caduca_pronto_si_estado_proximoCaducar', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="proximoCaducar" />);
  expect(getByText('Caduca pronto')).toBeTruthy();
});

it('renderiza_texto_Bajo_stock_si_estado_bajoStock', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="bajoStock" />);
  expect(getByText('Bajo stock')).toBeTruthy();
});

it('renderiza_texto_En_stock_si_estado_normal', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="normal" />);
  expect(getByText('En stock')).toBeTruthy();
});
