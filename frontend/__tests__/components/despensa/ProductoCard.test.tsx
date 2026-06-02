import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ProductoCard } from '@/components/despensa/ProductoCard';
import { Producto } from '@/services/despensaService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const productoBase: Producto = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Leche Entera',
  cantidad: 3,
  unidad: 'litros',
  estado: 'normal',
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const onEditar     = jest.fn();
const onEliminar   = jest.fn();
const onIncrementar = jest.fn();
const onDecrementar = jest.fn();
const onPress      = jest.fn();

const defaultProps = {
  producto: productoBase,
  onEditar,
  onEliminar,
  onIncrementar,
  onDecrementar,
  onPress,
};

beforeEach(() => jest.clearAllMocks());

it('renderiza_nombre_cantidad_y_unidad_correctamente', () => {
  const { getByText } = render(<ProductoCard {...defaultProps} />);
  expect(getByText('Leche Entera')).toBeTruthy();
  expect(getByText('3 litros')).toBeTruthy();
});

it('renderiza_badge_de_estado_En_stock', () => {
  const { getByText } = render(<ProductoCard {...defaultProps} />);
  expect(getByText('En stock')).toBeTruthy();
});

it('llama_onIncrementar_al_pulsar_el_boton_mas', () => {
  const { UNSAFE_getByProps } = render(<ProductoCard {...defaultProps} />);
  fireEvent.press(UNSAFE_getByProps({ onPress: onIncrementar }));
  expect(onIncrementar).toHaveBeenCalledTimes(1);
});

it('llama_onDecrementar_al_pulsar_el_boton_menos', () => {
  const { UNSAFE_getByProps } = render(<ProductoCard {...defaultProps} />);
  fireEvent.press(UNSAFE_getByProps({ onPress: onDecrementar }));
  expect(onDecrementar).toHaveBeenCalledTimes(1);
});

it('llama_onEditar_al_pulsar_el_boton_editar', () => {
  const { UNSAFE_getByProps } = render(<ProductoCard {...defaultProps} />);
  fireEvent.press(UNSAFE_getByProps({ onPress: onEditar }));
  expect(onEditar).toHaveBeenCalledTimes(1);
});

it('llama_onEliminar_al_pulsar_el_boton_eliminar', () => {
  const { UNSAFE_getByProps } = render(<ProductoCard {...defaultProps} />);
  fireEvent.press(UNSAFE_getByProps({ onPress: onEliminar }));
  expect(onEliminar).toHaveBeenCalledTimes(1);
});

it('muestra_aviso_duplicados_si_posiblesDuplicados_no_esta_vacio', () => {
  const productoConDuplicados: Producto = {
    ...productoBase,
    posiblesDuplicados: [{ ...productoBase, id: 'prod-0', nombre: 'Leche' }],
  };
  const { getByText } = render(
    <ProductoCard {...defaultProps} producto={productoConDuplicados} />
  );
  expect(getByText('Posible duplicado en despensa')).toBeTruthy();
});
