import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ListaPasos } from '@/components/receta/ListaPasos';
import { PasoReceta } from '@/services/recetaService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onEliminar = jest.fn();
const onReordenar = jest.fn();

const pasos: PasoReceta[] = [
  { id: 'p1', orden: 1, descripcion: 'Calentar el agua' },
  { id: 'p2', orden: 2, descripcion: 'Añadir el arroz' },
];

beforeEach(() => jest.clearAllMocks());

it('muestra_estado_vacio_cuando_no_hay_pasos', () => {
  const { getByText } = render(<ListaPasos pasos={[]} onEliminar={onEliminar} />);
  expect(getByText('Sin pasos todavía')).toBeTruthy();
});

it('renderiza_descripcion_de_cada_paso', () => {
  const { getByText } = render(<ListaPasos pasos={pasos} onEliminar={onEliminar} />);
  expect(getByText('Calentar el agua')).toBeTruthy();
  expect(getByText('Añadir el arroz')).toBeTruthy();
});

it('renderiza_numero_de_orden_de_cada_paso', () => {
  const { getAllByText } = render(<ListaPasos pasos={pasos} onEliminar={onEliminar} />);
  expect(getAllByText('1')).toBeTruthy();
  expect(getAllByText('2')).toBeTruthy();
});

it('llama_onReordenar_al_pulsar_chevron_arriba', () => {
  const { UNSAFE_getAllByProps } = render(
    <ListaPasos pasos={pasos} onEliminar={onEliminar} onReordenar={onReordenar} />
  );
  const botonesActivos = UNSAFE_getAllByProps({ disabled: false });
  fireEvent.press(botonesActivos[0]);
  expect(onReordenar).toHaveBeenCalledTimes(1);
});
