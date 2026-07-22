import React from 'react';
import { render } from '@testing-library/react-native';
import { ImagenReceta } from '@/components/receta/ImagenReceta';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

const onActualizar = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('muestra_placeholder_cuando_no_hay_imagen', () => {
  const { getByText } = render(<ImagenReceta onActualizar={onActualizar} />);
  expect(getByText('Toca para añadir imagen')).toBeTruthy();
});

it('muestra_botones_galeria_y_camara', () => {
  const { getAllByText } = render(<ImagenReceta onActualizar={onActualizar} />);
  expect(getAllByText('Galería')).toBeTruthy();
  expect(getAllByText('Cámara')).toBeTruthy();
});

it('no_muestra_placeholder_cuando_hay_imagenUrl', () => {
  const { queryByText } = render(
    <ImagenReceta imagenUrl="https://img.com/foto.jpg" onActualizar={onActualizar} />
  );
  expect(queryByText('Toca para añadir imagen')).toBeNull();
});
