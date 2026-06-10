import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FormIngrediente } from '@/components/receta/FormIngrediente';

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
