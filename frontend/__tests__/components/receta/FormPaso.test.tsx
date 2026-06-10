import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FormPaso } from '@/components/receta/FormPaso';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

const onGuardar = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('renderiza_textarea_de_descripcion', () => {
  const { getByPlaceholderText } = render(<FormPaso onGuardar={onGuardar} />);
  expect(getByPlaceholderText('Describe el paso *')).toBeTruthy();
});

it('muestra_boton_añadir_paso', () => {
  const { getAllByText } = render(<FormPaso onGuardar={onGuardar} />);
  expect(getAllByText('+ Añadir paso').length).toBeGreaterThan(0);
});

it('muestra_error_si_descripcion_vacia_al_guardar', async () => {
  const { getAllByText, getByText } = render(<FormPaso onGuardar={onGuardar} />);
  fireEvent.press(getAllByText('+ Añadir paso')[0]);
  await waitFor(() => {
    expect(getByText('La descripción es obligatoria')).toBeTruthy();
  });
  expect(onGuardar).not.toHaveBeenCalled();
});

it('llama_onGuardar_con_descripcion_correcta', async () => {
  onGuardar.mockResolvedValue(undefined);
  const { getByPlaceholderText, getAllByText } = render(<FormPaso onGuardar={onGuardar} />);
  fireEvent.changeText(getByPlaceholderText('Describe el paso *'), 'Calentar el agua');
  fireEvent.press(getAllByText('+ Añadir paso')[0]);
  await waitFor(() => {
    expect(onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({ descripcion: 'Calentar el agua' })
    );
  });
});
