import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ListaIngredientes } from '@/components/receta/ListaIngredientes';
import { IngredienteReceta } from '@/services/recetaService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onEliminar = jest.fn();

const ingredientes: IngredienteReceta[] = [
  { id: 'ing-1', nombre: 'Arroz', cantidad: 200, unidad: 'g' },
  { id: 'ing-2', nombre: 'Pollo', cantidad: 300, unidad: 'g', observacion: 'troceado' },
];

beforeEach(() => jest.clearAllMocks());

it('muestra_estado_vacio_cuando_no_hay_ingredientes', () => {
  const { getByText } = render(<ListaIngredientes ingredientes={[]} onEliminar={onEliminar} />);
  expect(getByText('Sin ingredientes todavía')).toBeTruthy();
});

it('renderiza_nombre_y_cantidad_de_cada_ingrediente', () => {
  const { getByText } = render(<ListaIngredientes ingredientes={ingredientes} onEliminar={onEliminar} />);
  expect(getByText('Arroz')).toBeTruthy();
  expect(getByText('Pollo')).toBeTruthy();
  expect(getByText('200 g')).toBeTruthy();
});

it('muestra_observacion_cuando_existe', () => {
  const { getByText } = render(<ListaIngredientes ingredientes={ingredientes} onEliminar={onEliminar} />);
  expect(getByText(/troceado/)).toBeTruthy();
});

it('llama_onEliminar_con_id_correcto_al_pulsar_papelera', () => {
  const { UNSAFE_getAllByProps } = render(
    <ListaIngredientes ingredientes={ingredientes} onEliminar={onEliminar} />
  );
  const btns = UNSAFE_getAllByProps({ disabled: false });
  fireEvent.press(btns[0]);
  expect(onEliminar).toHaveBeenCalledWith('ing-1');
});
