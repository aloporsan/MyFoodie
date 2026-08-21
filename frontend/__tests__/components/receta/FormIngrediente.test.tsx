import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FormIngrediente } from '@/components/receta/FormIngrediente';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onGuardar = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('renderiza_boton_añadir_ingrediente', () => {
  const { getByText } = render(<FormIngrediente onGuardar={onGuardar} />);
  expect(getByText('+ Añadir ingrediente')).toBeTruthy();
});

it('muestra_error_si_nombre_vacio_al_guardar', async () => {
  const { getByText } = render(<FormIngrediente onGuardar={onGuardar} />);
  fireEvent.press(getByText('+ Añadir ingrediente'));
  await waitFor(() => {
    expect(getByText('Obligatorio')).toBeTruthy();
  });
  expect(onGuardar).not.toHaveBeenCalled();
});

it('muestra_error_si_cantidad_invalida', async () => {
  const { getByText, getByPlaceholderText } = render(<FormIngrediente onGuardar={onGuardar} />);
  fireEvent.changeText(getByPlaceholderText('Nombre *'), 'Arroz');
  fireEvent.changeText(getByPlaceholderText('Cant.'), '-5');
  fireEvent.press(getByText('+ Añadir ingrediente'));
  await waitFor(() => {
    expect(getByText('Debe ser mayor que 0')).toBeTruthy();
  });
});

it('llama_onGuardar_con_datos_correctos_si_valido', async () => {
  onGuardar.mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText } = render(<FormIngrediente onGuardar={onGuardar} />);
  fireEvent.changeText(getByPlaceholderText('Nombre *'), 'Arroz');
  fireEvent.changeText(getByPlaceholderText('Cant.'), '200');
  fireEvent.press(getByText('+ Añadir ingrediente'));
  await waitFor(() => {
    expect(onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Arroz', cantidad: 200 })
    );
  });
});

it('limpia_campos_tras_guardar_exitoso', async () => {
  onGuardar.mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText } = render(<FormIngrediente onGuardar={onGuardar} />);
  fireEvent.changeText(getByPlaceholderText('Nombre *'), 'Arroz');
  fireEvent.changeText(getByPlaceholderText('Cant.'), '200');
  fireEvent.press(getByText('+ Añadir ingrediente'));
  await waitFor(() => {
    expect(getByPlaceholderText('Nombre *').props.value).toBe('');
  });
});

// -------------------------------------------------------------------------
// RF-DESP-019 — Normalización de unidades subjetivas (#161)
// -------------------------------------------------------------------------

it('selector_unidad_muestra_dos_grupos', () => {
  const { getByText } = render(<FormIngrediente onGuardar={onGuardar} />);
  expect(getByText('Unidades objetivas (recomendadas)')).toBeTruthy();
  expect(getByText('Unidades subjetivas (se convertirán automáticamente)')).toBeTruthy();
});

it('seleccionar_unidad_subjetiva_muestra_aviso_conversion', () => {
  const { getByText, queryByTestId } = render(<FormIngrediente onGuardar={onGuardar} />);
  expect(queryByTestId('aviso-conversion-unidad')).toBeNull();

  fireEvent.press(getByText('Cucharada(s)'));

  expect(queryByTestId('aviso-conversion-unidad')).toBeTruthy();
  expect(getByText(/se convertirá automáticamente/)).toBeTruthy();
});

it('aviso_muestra_equivalencia_correcta', () => {
  const { getByText, getByPlaceholderText } = render(<FormIngrediente onGuardar={onGuardar} />);
  fireEvent.changeText(getByPlaceholderText('Cant.'), '2');
  fireEvent.press(getByText('Cucharada(s)'));

  expect(getByText(/30 ml/)).toBeTruthy();
});

it('seleccionar_unidad_objetiva_no_muestra_aviso', () => {
  const { getByText, queryByTestId } = render(<FormIngrediente onGuardar={onGuardar} />);

  fireEvent.press(getByText('kg'));

  expect(queryByTestId('aviso-conversion-unidad')).toBeNull();
});
