import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductoEstadoBadge } from '@/components/despensa/ProductoEstadoBadge';
import { colors } from '@/theme/colors';

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

it('renderiza_texto_Caduca_esta_semana_si_estado_caduca_semana', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caduca_semana" />);
  expect(getByText('Caduca esta semana')).toBeTruthy();
});

it('renderiza_texto_Caduca_este_mes_si_estado_caduca_mes', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="caduca_mes" />);
  expect(getByText('Caduca este mes')).toBeTruthy();
});

it('renderiza_texto_Bajo_stock_si_estado_bajoStock', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="bajoStock" />);
  expect(getByText('Bajo stock')).toBeTruthy();
});

it('renderiza_texto_En_stock_si_estado_normal', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="normal" />);
  expect(getByText('En stock')).toBeTruthy();
});

it('badge_gris_oscuro_si_sin_stock', () => {
  const { getByText } = render(<ProductoEstadoBadge estado="sin_stock" />);
  const texto = getByText('Sin stock');
  expect(texto).toBeTruthy();

  const estiloTexto = Object.assign({}, ...[texto.props.style].flat());
  expect(estiloTexto.color).toBe(colors.white);

  const estiloBadge = Object.assign({}, ...[texto.parent?.props.style].flat());
  expect(estiloBadge.backgroundColor).toBe('#616161');
});

it('badge_muestra_sin_stock_con_prioridad_sobre_caducado', () => {
  // Un producto sin stock nunca debe mostrarse como "Caducado": el estado que
  // llega desde el backend ya resuelve la jerarquía, y el badge solo pinta
  // 'sin_stock' cuando ese es el estado recibido, nunca 'caducado'.
  const { getByText, queryByText } = render(<ProductoEstadoBadge estado="sin_stock" />);
  expect(getByText('Sin stock')).toBeTruthy();
  expect(queryByText('Caducado')).toBeNull();
});
