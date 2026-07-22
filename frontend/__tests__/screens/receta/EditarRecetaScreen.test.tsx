import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { EditarRecetaScreen } from '@/screens/receta/EditarRecetaScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/store/recetaStore', () => ({ useRecetaStore: jest.fn() }));
jest.mock('@/store/perfilStore', () => ({ usePerfilStore: jest.fn() }));
jest.mock('@/services/recetaService', () => ({
  recetaService: {
    añadirIngrediente: jest.fn(), eliminarIngrediente: jest.fn(),
    añadirPaso: jest.fn(), eliminarPaso: jest.fn(), reordenarPasos: jest.fn(),
    actualizarImagen: jest.fn(),
  },
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

const mockRecetaBorrador = {
  id: 'r1', autorId: 'u1', titulo: 'Paella valenciana',
  descripcion: 'Receta tradicional', tiempoEstimado: 60,
  dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [],
  estado: 'borrador' as const, ingredientes: [], pasos: [],
  createdAt: '', updatedAt: '',
};

const mockRecetaPublicada = { ...mockRecetaBorrador, estado: 'publicada' as const };

const { useRouter, useLocalSearchParams } = require('expo-router');
const { useRecetaStore } = require('@/store/recetaStore');
const { usePerfilStore } = require('@/store/perfilStore');

const mockStoreBase = {
  recetaActual: null,
  cargarReceta: jest.fn(),
  editarReceta: jest.fn(),
  publicarReceta: jest.fn(),
  actualizarImagen: jest.fn(),
  actualizarEtiquetas: jest.fn(),
  añadirIngrediente: jest.fn(),
  eliminarIngrediente: jest.fn(),
  añadirPaso: jest.fn(),
  eliminarPaso: jest.fn(),
  reordenarPasos: jest.fn(),
  isLoading: false,
  error: null,
  clearError: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true });
  useLocalSearchParams.mockReturnValue({ id: 'r1' });
  usePerfilStore.mockReturnValue({ refreshEstadisticas: jest.fn() });
  useRecetaStore.mockReturnValue(mockStoreBase);
});

it('muestra_indicador_de_carga_cuando_isLoading_es_true', () => {
  useRecetaStore.mockReturnValue({ ...mockStoreBase, isLoading: true });
  const { getByTestId } = render(<EditarRecetaScreen />);
  expect(getByTestId('loading-screen-logo')).toBeTruthy();
});

it('muestra_boton_publicar_para_borrador', async () => {
  useRecetaStore.mockReturnValue({
    ...mockStoreBase,
    recetaActual: mockRecetaBorrador,
  });
  const { getByText } = render(<EditarRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Publicar receta')).toBeTruthy();
  });
});

it('muestra_boton_confirmar_cambios_para_publicada', async () => {
  useRecetaStore.mockReturnValue({
    ...mockStoreBase,
    recetaActual: mockRecetaPublicada,
  });
  const { getByText } = render(<EditarRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Confirmar cambios')).toBeTruthy();
  });
});

it('muestra_badge_borrador_para_receta_en_borrador', async () => {
  useRecetaStore.mockReturnValue({
    ...mockStoreBase,
    recetaActual: mockRecetaBorrador,
  });
  const { getByText } = render(<EditarRecetaScreen />);
  await waitFor(() => {
    expect(getByText('Borrador')).toBeTruthy();
  });
});
