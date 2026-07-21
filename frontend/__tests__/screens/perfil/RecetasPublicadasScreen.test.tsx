import React from 'react';
import { fireEvent, render, act, waitFor } from '@testing-library/react-native';
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
  { id: '1', autorId: 'u1', titulo: 'Tortilla española clásica', descripcion: 'Clásica', tiempoEstimado: 25, dificultad: 'Fácil', categoria: 'Huevos', etiquetas: [], estado: 'publicada', totalLikes: 3, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
  { id: '2', autorId: 'u1', titulo: 'Lentejas con chorizo', descripcion: 'Contundente', tiempoEstimado: 50, dificultad: 'Fácil', categoria: 'Legumbres', etiquetas: [], estado: 'borrador', totalLikes: 0, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
  { id: '3', autorId: 'u1', titulo: 'Paella valenciana', descripcion: 'Tradicional', tiempoEstimado: 90, dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [], estado: 'publicada', totalLikes: 12, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
];

const mockPush = jest.fn();
const mockBack = jest.fn();
const { useRouter } = require('expo-router');
const { recetaService } = require('@/services/recetaService');

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ push: mockPush, back: mockBack });
  recetaService.misRecetas.mockResolvedValue(MOCK_RECETAS);
});

it('renderiza_lista_de_recetas_publicadas_con_datos_reales', async () => {
  const { getByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => {
    expect(getByText('Tortilla española clásica')).toBeTruthy();
    expect(getByText('Lentejas con chorizo')).toBeTruthy();
    expect(getByText('Paella valenciana')).toBeTruthy();
  });
});

it('muestra_badge_publicada_o_borrador_segun_estado', async () => {
  const { getAllByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => {
    expect(getAllByText('Publicada')).toHaveLength(2);
    expect(getAllByText('Borrador')).toHaveLength(1);
  });
});

it('muestra_empty_state_con_boton_crear_si_lista_vacia', async () => {
  recetaService.misRecetas.mockResolvedValue([]);
  const { getByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => {
    expect(getByText('Aún no has publicado ninguna receta')).toBeTruthy();
    expect(getByText('Crear mi primera receta')).toBeTruthy();
  });
});

it('navega_a_CrearReceta_al_pulsar_boton_en_estado_vacio', async () => {
  recetaService.misRecetas.mockResolvedValue([]);
  const { getByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => expect(getByText('Crear mi primera receta')).toBeTruthy());
  fireEvent.press(getByText('Crear mi primera receta'));
  expect(mockPush).toHaveBeenCalledWith('/(tabs)/receta');
});

it('navega_a_DetalleReceta_al_pulsar_item', async () => {
  const { getByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => expect(getByText('Tortilla española clásica')).toBeTruthy());
  fireEvent.press(getByText('Tortilla española clásica'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/receta/[id]', params: { id: '1' } });
});

it('navega_a_EditarReceta_al_pulsar_boton_editar', async () => {
  const { getAllByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => expect(getAllByText('Editar').length).toBeGreaterThan(0));
  fireEvent.press(getAllByText('Editar')[0]);
  expect(mockPush).toHaveBeenCalledWith('/receta/editar?id=1');
});

it('actualiza_lista_al_hacer_pull_to_refresh', async () => {
  const { UNSAFE_getByType, getByText } = render(<RecetasPublicadasScreen />);
  await waitFor(() => expect(getByText('Tortilla española clásica')).toBeTruthy());
  const { FlatList } = require('react-native');
  const flatList = UNSAFE_getByType(FlatList);
  await act(async () => {
    await flatList.props.refreshControl.props.onRefresh();
  });
  expect(recetaService.misRecetas).toHaveBeenCalledTimes(2);
  expect(flatList.props.data.length).toBeGreaterThan(0);
});
