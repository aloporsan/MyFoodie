import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FiltrosBar } from '@/components/despensa/FiltrosBar';

jest.mock('@expo/vector-icons', () => ({ FontAwesome: 'FontAwesome' }));

const onFiltroChange = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('renderiza_chip_Todos_y_los_chips_de_estados_presentes', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={['caducado', 'bajoStock']}
      onFiltroChange={onFiltroChange}
    />
  );
  expect(getByText('Todos')).toBeTruthy();
  expect(getByText('Caducados')).toBeTruthy();
  expect(getByText('Bajo stock')).toBeTruthy();
});

it('no_renderiza_si_solo_hay_el_chip_Todos', () => {
  const { queryByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={['normal']}
      onFiltroChange={onFiltroChange}
    />
  );
  // normal se filtra fuera → solo queda "Todos" → el componente devuelve null
  expect(queryByText('Todos')).toBeNull();
});

it('llama_onFiltroChange_con_el_id_correcto_al_pulsar_chip', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={['caducado']}
      onFiltroChange={onFiltroChange}
    />
  );
  fireEvent.press(getByText('Caducados'));
  expect(onFiltroChange).toHaveBeenCalledWith('caducado');
});

it('llama_onFiltroChange_con_todos_al_pulsar_chip_Todos', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="caducado"
      estadosPresentes={['caducado']}
      onFiltroChange={onFiltroChange}
    />
  );
  fireEvent.press(getByText('Todos'));
  expect(onFiltroChange).toHaveBeenCalledWith('todos');
});
