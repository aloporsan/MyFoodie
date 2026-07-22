import React from 'react';
import { render } from '@testing-library/react-native';
import { EstadisticasCard } from '@/components/dashboard/EstadisticasCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const estadisticas = {
  totalRegistrados: 10,
  consumidos: 2,
  caducadosHistorico: 1,
  categoriaLider: 'Lácteos',
  aprovechamiento: 80.0,
};

it('renderiza_el_valor_de_aprovechamiento', () => {
  const { getByText } = render(<EstadisticasCard estadisticas={estadisticas} />);
  expect(getByText('80%')).toBeTruthy();
});

it('renderiza_la_categoria_con_mas_productos', () => {
  const { getByText } = render(<EstadisticasCard estadisticas={estadisticas} />);
  expect(getByText('Lácteos')).toBeTruthy();
  expect(getByText('Categoría más frecuente')).toBeTruthy();
});

it('renderiza_contadores_de_caducados_y_consumidos', () => {
  const { getByText } = render(<EstadisticasCard estadisticas={estadisticas} />);
  expect(getByText('10')).toBeTruthy(); // totalRegistrados
  expect(getByText('2')).toBeTruthy();  // consumidos
  expect(getByText('1')).toBeTruthy();  // caducadosHistorico
});

it('no_renderiza_chip_de_categoria_si_es_guion', () => {
  const { queryByText } = render(
    <EstadisticasCard estadisticas={{ ...estadisticas, categoriaLider: '-' }} />
  );
  expect(queryByText('Categoría más frecuente')).toBeNull();
});
