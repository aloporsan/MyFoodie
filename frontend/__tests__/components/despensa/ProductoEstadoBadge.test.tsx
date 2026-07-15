import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductoEstadoBadge } from '@/components/despensa/ProductoEstadoBadge';

it('renderiza_texto_Caducado_si_estado_caducado', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caducado" />);
  expect(getByText('Caducado')).toBeTruthy();
});

it('renderiza_texto_Caduca_hoy_si_estado_caduca_hoy', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caduca_hoy" />);
  expect(getByText('Caduca hoy')).toBeTruthy();
});

it('renderiza_texto_Caduca_pronto_si_estado_caduca_pronto', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caduca_pronto" />);
  expect(getByText('Caduca pronto')).toBeTruthy();
});

it('renderiza_texto_Esta_semana_si_estado_caduca_semana', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caduca_semana" />);
  expect(getByText('Esta semana')).toBeTruthy();
});

it('renderiza_texto_Este_mes_si_estado_caduca_mes', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caduca_mes" />);
  expect(getByText('Este mes')).toBeTruthy();
});

it('renderiza_texto_Bajo_stock_si_estado_bajoStock', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="bajoStock" />);
  expect(getByText('Bajo stock')).toBeTruthy();
});

it('renderiza_texto_En_stock_si_estado_normal', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="normal" />);
  expect(getByText('En stock')).toBeTruthy();
});
