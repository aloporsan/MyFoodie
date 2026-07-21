import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FiltrosBar } from '@/components/despensa/FiltrosBar';

jest.mock('@expo/vector-icons', () => ({ FontAwesome: 'FontAwesome' }));

const onFiltroChange = jest.fn();
const onOrdenChange = jest.fn();

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

it('no_renderiza_seccion_de_estados_si_solo_hay_el_chip_Todos', () => {
  const { queryByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={['normal']}
      onFiltroChange={onFiltroChange}
    />
  );
  // normal se filtra fuera → solo queda "Todos" → la sección de estados no se renderiza
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

// -------------------------------------------------------------------------
// Ordenación (#137)
// -------------------------------------------------------------------------

it('renderiza_seccion_de_ordenacion', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={[]}
      onFiltroChange={onFiltroChange}
      ordenActivo="reciente_primero"
      onOrdenChange={onOrdenChange}
    />
  );
  expect(getByText('Más reciente')).toBeTruthy();
});

it('muestra_todas_las_opciones_de_ordenacion', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={[]}
      onFiltroChange={onFiltroChange}
      ordenActivo="reciente_primero"
      onOrdenChange={onOrdenChange}
    />
  );
  expect(getByText('Nombre A-Z')).toBeTruthy();
  expect(getByText('Nombre Z-A')).toBeTruthy();
  expect(getByText('Caduca antes')).toBeTruthy();
  expect(getByText('Más cantidad')).toBeTruthy();
  expect(getByText('Menos cantidad')).toBeTruthy();
  expect(getByText('Más reciente')).toBeTruthy();
  expect(getByText('Por categoría')).toBeTruthy();
});

it('opcion_activa_tiene_estilo_verde', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={[]}
      onFiltroChange={onFiltroChange}
      ordenActivo="nombre_asc"
      onOrdenChange={onOrdenChange}
    />
  );
  const textoActivo = getByText('Nombre A-Z');
  const estiloAplanado = Object.assign({}, ...[textoActivo.props.style].flat());
  expect(estiloAplanado.color).toBe('#7FC62A');

  const textoInactivo = getByText('Nombre Z-A');
  const estiloInactivo = Object.assign({}, ...[textoInactivo.props.style].flat());
  expect(estiloInactivo.color).not.toBe('#7FC62A');
});

it('llama_setOrden_al_seleccionar_opcion', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={[]}
      onFiltroChange={onFiltroChange}
      ordenActivo="reciente_primero"
      onOrdenChange={onOrdenChange}
    />
  );
  fireEvent.press(getByText('Por categoría'));
  expect(onOrdenChange).toHaveBeenCalledWith('categoria');
});

it('filtros_de_estado_y_ordenacion_son_independientes', () => {
  const { getByText } = render(
    <FiltrosBar
      filtroActivo="todos"
      estadosPresentes={['caducado']}
      onFiltroChange={onFiltroChange}
      ordenActivo="reciente_primero"
      onOrdenChange={onOrdenChange}
    />
  );
  fireEvent.press(getByText('Caducados'));
  expect(onFiltroChange).toHaveBeenCalledWith('caducado');
  expect(onOrdenChange).not.toHaveBeenCalled();

  fireEvent.press(getByText('Más cantidad'));
  expect(onOrdenChange).toHaveBeenCalledWith('cantidad_desc');
  expect(onFiltroChange).toHaveBeenCalledTimes(1);
});
