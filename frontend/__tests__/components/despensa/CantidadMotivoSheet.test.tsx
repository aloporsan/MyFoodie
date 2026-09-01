import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CantidadMotivoSheet } from '@/components/despensa/CantidadMotivoSheet';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onConfirm = jest.fn();
const onCancelar = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('topa_la_cantidad_al_maximo_disponible_al_escribir_un_valor_mayor', () => {
  const { getByDisplayValue } = render(
    <CantidadMotivoSheet
      visible={true}
      unidad="unidades"
      modo="restar"
      maxCantidad={3}
      onConfirm={onConfirm}
      onCancelar={onCancelar}
    />
  );
  fireEvent.changeText(getByDisplayValue('1'), '7');
  expect(getByDisplayValue('3')).toBeTruthy();
});

it('no_permite_confirmar_una_cantidad_mayor_a_la_disponible', () => {
  const { getByDisplayValue, getByText } = render(
    <CantidadMotivoSheet
      visible={true}
      unidad="unidades"
      modo="restar"
      maxCantidad={3}
      onConfirm={onConfirm}
      onCancelar={onCancelar}
    />
  );
  fireEvent.changeText(getByDisplayValue('1'), '7');
  fireEvent.press(getByText('Consumido'));
  fireEvent.press(getByText('Registrar uso'));
  expect(onConfirm).toHaveBeenCalledWith(3, 'consumido', undefined);
});

it('no_aplica_el_tope_cuando_el_modo_es_sumar', () => {
  const { getByDisplayValue } = render(
    <CantidadMotivoSheet
      visible={true}
      unidad="unidades"
      modo="sumar"
      maxCantidad={3}
      onConfirm={onConfirm}
      onCancelar={onCancelar}
    />
  );
  fireEvent.changeText(getByDisplayValue('1'), '7');
  expect(getByDisplayValue('7')).toBeTruthy();
});

it('muestra_el_aviso_cuando_se_proporciona', () => {
  const { getByText } = render(
    <CantidadMotivoSheet
      visible={true}
      unidad="litros"
      modo="restar"
      aviso="Se descontará primero del lote que caduca el 01/02/2026 (2 litros)."
      onConfirm={onConfirm}
      onCancelar={onCancelar}
    />
  );
  expect(getByText('Se descontará primero del lote que caduca el 01/02/2026 (2 litros).')).toBeTruthy();
});

it('no_muestra_ningun_aviso_cuando_no_se_proporciona', () => {
  const { queryByText } = render(
    <CantidadMotivoSheet
      visible={true}
      unidad="litros"
      modo="restar"
      onConfirm={onConfirm}
      onCancelar={onCancelar}
    />
  );
  expect(queryByText(/descontará/)).toBeNull();
});
