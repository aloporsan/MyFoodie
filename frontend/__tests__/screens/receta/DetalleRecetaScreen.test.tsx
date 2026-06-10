import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { DetalleRecetaScreen } from '@/screens/receta/DetalleRecetaScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/recetaService', () => ({
  recetaService: { obtenerReceta: jest.fn(), eliminarReceta: jest.fn() },
}));
jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));

const mockReceta = {
  id: 'r1', autorId: 'u1', titulo: 'Paella valenciana',
  descripcion: 'Receta tradicional', tiempoEstimado: 60,
  dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [],
  estado: 'publicada' as const, ingredientes: [], pasos: [],
  createdAt: '', updatedAt: '',
};

const { useRouter, useLocalSearchParams } = require('expo-router');
const { recetaService } = require('@/services/recetaService');
const { useAuthStore } = require('@/store/authStore');

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true });
  useLocalSearchParams.mockReturnValue({ id: 'r1' });
  recetaService.obtenerReceta.mockResolvedValue(mockReceta);
  useAuthStore.mockReturnValue('u1');
});

it('muestra_indicador_de_carga_al_inicio', () => {
  const { UNSAFE_getByType } = render(<DetalleRecetaScreen />);
  const { ActivityIndicator } = require('react-native');
  expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
});

it('muestra_titulo_de_receta_tras_cargar', async () => {
  const { getAllByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getAllByText('Paella valenciana').length).toBeGreaterThan(0);
  });
});

it('muestra_descripcion_tras_cargar', async () => {
  const { getByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Receta tradicional')).toBeTruthy();
  });
});

it('muestra_error_si_el_servicio_falla', async () => {
  recetaService.obtenerReceta.mockRejectedValue(new Error('No encontrada'));
  const { getByText } = render(<DetalleRecetaScreen />);
  await waitFor(() => {
    expect(getByText('No se pudo cargar la receta')).toBeTruthy();
  });
});
