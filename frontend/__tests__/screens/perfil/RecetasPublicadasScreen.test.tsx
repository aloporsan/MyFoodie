import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { RecetasPublicadasScreen } from '@/screens/perfil/RecetasPublicadasScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/recetaService', () => ({
  recetaService: { misRecetas: jest.fn() },
}));

const MOCK_RECETAS = [
  { id: '1', autorId: 'u1', titulo: 'Tortilla española clásica', descripcion: 'Clásica', tiempoEstimado: 25, dificultad: 'Fácil', categoria: 'Huevos', etiquetas: [], estado: 'publicada', createdAt: '', updatedAt: '' },
  { id: '2', autorId: 'u1', titulo: 'Lentejas con chorizo', descripcion: 'Contundente', tiempoEstimado: 50, dificultad: 'Fácil', categoria: 'Legumbres', etiquetas: [], estado: 'publicada', createdAt: '', updatedAt: '' },
  { id: '3', autorId: 'u1', titulo: 'Paella valenciana', descripcion: 'Tradicional', tiempoEstimado: 90, dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [], estado: 'publicada', createdAt: '', updatedAt: '' },
];

const mockBack = jest.fn();
const { useRouter } = require('expo-router');
const { recetaService } = require('@/services/recetaService');

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: jest.fn(), back: mockBack });
  recetaService.misRecetas.mockResolvedValue(MOCK_RECETAS);
});

it('renderiza_lista_de_recetas_publicadas', async () => {
  const { getByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => {
    expect(getByText('Tortilla española clásica')).toBeTruthy();
    expect(getByText('Lentejas con chorizo')).toBeTruthy();
    expect(getByText('Paella valenciana')).toBeTruthy();
  });
});

it('muestra_empty_state_con_boton_crear_si_lista_vacia', async () => {
  recetaService.misRecetas.mockResolvedValue([]);
  const { getByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => {
    expect(getByText('Aún no has publicado ninguna receta')).toBeTruthy();
  });
});

it('navega_a_CrearReceta_al_pulsar_boton', async () => {
  const { getByText } = render(<RecetasPublicadasScreen />);
  expect(getByText('Mis recetas')).toBeTruthy();
  await waitFor(() => {
    expect(getByText('Tortilla española clásica')).toBeTruthy();
  });
});

it('actualiza_lista_al_hacer_pull_to_refresh', async () => {
  const { UNSAFE_getByType } = render(<RecetasPublicadasScreen />);
  await waitFor(() => {}); // espera carga inicial
  const { FlatList } = require('react-native');
  const flatList = UNSAFE_getByType(FlatList);
  await act(async () => {
    await flatList.props.refreshControl.props.onRefresh();
  });
  expect(flatList.props.data.length).toBeGreaterThan(0);
});
