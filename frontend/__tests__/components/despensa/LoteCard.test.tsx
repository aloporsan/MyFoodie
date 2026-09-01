import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { LoteCard } from '@/components/despensa/LoteCard';
import { LoteProducto } from '@/services/loteService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const loteBase: LoteProducto = {
  id: 'lote-1',
  cantidad: 2,
  unidad: 'litros',
  fechaCaducidad: '2026-02-01',
  fechaCompra: '2026-01-01',
  origen: 'manual',
  diasHastaCaducidad: 5,
  estado: 'normal',
  createdAt: '2026-01-01T10:00:00',
};

beforeEach(() => jest.clearAllMocks());

it('renderiza_cantidad_unidad_y_fecha_de_caducidad', () => {
  const { getByText } = render(<LoteCard lote={loteBase} />);
  expect(getByText('2 litros')).toBeTruthy();
  expect(getByText('Caduca el 01/02/2026 · En 5 días')).toBeTruthy();
});

it('no_renderiza_la_fila_de_fecha_si_el_lote_no_tiene_fechaCaducidad', () => {
  const { queryByText } = render(
    <LoteCard lote={{ ...loteBase, fechaCaducidad: undefined }} />
  );
  expect(queryByText(/Caduca el/)).toBeNull();
});

it('modo_gestion_muestra_los_iconos_de_editar_y_eliminar_y_los_llama', () => {
  const onEditar = jest.fn();
  const onEliminar = jest.fn();
  const { UNSAFE_getByProps } = render(
    <LoteCard lote={loteBase} onEditar={onEditar} onEliminar={onEliminar} />
  );

  fireEvent.press(UNSAFE_getByProps({ onPress: onEditar }));
  expect(onEditar).toHaveBeenCalledTimes(1);

  fireEvent.press(UNSAFE_getByProps({ onPress: onEliminar }));
  expect(onEliminar).toHaveBeenCalledTimes(1);
});

it('modo_seleccion_sin_onEditar_ni_onEliminar_no_muestra_iconos_de_accion', () => {
  const { UNSAFE_queryAllByProps } = render(
    <LoteCard lote={loteBase} onPress={jest.fn()} />
  );
  expect(UNSAFE_queryAllByProps({ name: 'pencil' })).toHaveLength(0);
  expect(UNSAFE_queryAllByProps({ name: 'trash-outline' })).toHaveLength(0);
});

it('modo_seleccion_la_tarjeta_entera_es_pulsable_y_llama_onPress', () => {
  const onPress = jest.fn();
  const { UNSAFE_getByProps } = render(<LoteCard lote={loteBase} onPress={onPress} />);

  fireEvent.press(UNSAFE_getByProps({ onPress }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('sin_onPress_ni_onEditar_ni_onEliminar_la_tarjeta_esta_deshabilitada', () => {
  const { UNSAFE_getByProps } = render(<LoteCard lote={loteBase} />);
  expect(UNSAFE_getByProps({ disabled: true })).toBeTruthy();
});
