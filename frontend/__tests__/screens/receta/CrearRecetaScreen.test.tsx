import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { CrearRecetaScreen } from '@/screens/receta/CrearRecetaScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/store/recetaStore', () => ({ useRecetaStore: jest.fn() }));

const mockReceta = {
  id: 'r1', autorId: 'u1', titulo: 'Paella', descripcion: 'Desc',
  tiempoEstimado: 60, dificultad: 'Difícil', categoria: 'Arroces',
  etiquetas: [], estado: 'borrador' as const, ingredientes: [], pasos: [],
  createdAt: '', updatedAt: '',
};

const { useRouter } = require('expo-router');
const { useRecetaStore } = require('@/store/recetaStore');

const mockCrear = jest.fn();
const mockCargarBorradores = jest.fn();
const mockClearError = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: jest.fn(), back: jest.fn() });
  useRecetaStore.mockReturnValue({
    crearReceta: mockCrear,
    cargarMisBorradores: mockCargarBorradores,
    borradores: [],
    isLoading: false,
    error: null,
    clearError: mockClearError,
  });
});

it('renderiza_titulo_nueva_receta', () => {
  const { getByText } = render(<CrearRecetaScreen />);
  expect(getByText('Nueva receta')).toBeTruthy();
});

it('renderiza_boton_continuar', () => {
  const { getByText } = render(<CrearRecetaScreen />);
  expect(getByText('Continuar')).toBeTruthy();
});

it('muestra_errores_si_form_vacio_al_continuar', async () => {
  const { getByText } = render(<CrearRecetaScreen />);
  fireEvent.press(getByText('Continuar'));
  await waitFor(() => {
    expect(getByText('El título es obligatorio')).toBeTruthy();
  });
  expect(mockCrear).not.toHaveBeenCalled();
});

it('muestra_borradores_existentes', () => {
  useRecetaStore.mockReturnValue({
    crearReceta: mockCrear,
    cargarMisBorradores: mockCargarBorradores,
    borradores: [{ id: 'b1', titulo: 'Borrador pendiente', categoria: 'Arroces', tiempoEstimado: 30, estado: 'borrador' }],
    isLoading: false,
    error: null,
    clearError: mockClearError,
  });
  const { getByText } = render(<CrearRecetaScreen />);
  expect(getByText('Borrador pendiente')).toBeTruthy();
});

it('muestra_error_de_red_si_servicio_falla', async () => {
  useRecetaStore.mockReturnValue({
    crearReceta: mockCrear,
    cargarMisBorradores: mockCargarBorradores,
    borradores: [],
    isLoading: false,
    error: 'Error al crear la receta',
    clearError: mockClearError,
  });
  const { getByText } = render(<CrearRecetaScreen />);
  expect(getByText('Error al crear la receta')).toBeTruthy();
});
