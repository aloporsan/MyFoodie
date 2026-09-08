import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FeedScreen } from '@/screens/feed/FeedScreen';
import { useFeedStore } from '@/store/feedStore';
import { useToastStore } from '@/hooks/useToast';
import { feedService, RecetaFeed } from '@/services/feedService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({
  Image: Object.assign(() => null, { prefetch: jest.fn().mockResolvedValue(true) }),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: (cb: () => void) => cb(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/feedService');

// Sustituye el stack de gestos por botones testables: la mecánica de arrastre pertenece
// a react-native-gesture-handler, aquí solo se prueba la reacción de FeedScreen a
// onGuardar/onDescartar, que es lo que cambió con el fix optimista.
jest.mock('@/components/feed', () => {
  const { Pressable: P, Text: T } = require('react-native');
  return {
    FeedEmptyState: () => <T>Sin recetas</T>,
    FiltroFeedBar: () => null,
    GestosCard: ({ receta, posicion, onGuardar, onDescartar }: any) => {
      if (posicion !== 0) return null;
      return (
        <>
          <T>{receta.titulo}</T>
          <P testID="swipe-guardar" onPress={onGuardar}>
            <T>guardar</T>
          </P>
          <P testID="swipe-descartar" onPress={onDescartar}>
            <T>descartar</T>
          </P>
        </>
      );
    },
  };
});

const { useRouter } = require('expo-router');
const mockService = feedService as jest.Mocked<typeof feedService>;

const mockReceta = (overrides: Partial<RecetaFeed> = {}): RecetaFeed => ({
  id: 'receta-1',
  titulo: 'Tortilla de patatas',
  autorId: 'autor-1',
  tiempoEstimado: 40,
  dificultad: 'Media',
  numPersonas: 2,
  etiquetas: [],
  likes: 0,
  yaLike: false,
  yaGuardada: false,
  coincidenciaDespensa: 50,
  ingredientesDisponibles: 1,
  ingredientesFaltantes: 1,
  createdAt: '2026-01-01T10:00:00',
  ...overrides,
});

const estadoInicial = {
  recetas: [],
  pagina: 0,
  hayMas: false,
  isLoading: false,
  isLoadingMas: false,
  error: null,
  ultimaAccion: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  useFeedStore.setState({ ...estadoInicial, idsOcultos: new Set<string>() });
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
  useRouter.mockReturnValue({ push: jest.fn() });
});

it('carta_avanza_inmediatamente_tras_swipe_sin_esperar_api', async () => {
  const r1 = mockReceta({ id: 'receta-1', titulo: 'Tortilla' });
  const r2 = mockReceta({ id: 'receta-2', titulo: 'Paella' });
  mockService.obtenerFeed.mockResolvedValue({ recetas: [r1, r2], pagina: 0, totalPaginas: 1, hayMas: false });
  mockService.guardarReceta.mockReturnValue(new Promise(() => {})); // nunca se resuelve en el test

  const { getByText, queryByText, getByTestId } = render(<FeedScreen />);
  await waitFor(() => expect(getByText('Tortilla')).toBeTruthy());

  fireEvent.press(getByTestId('swipe-guardar'));

  expect(queryByText('Tortilla')).toBeNull();
  expect(getByText('Paella')).toBeTruthy();
  expect(useToastStore.getState().mensaje).toBe('Receta guardada');
});

it('no_muestra_toast_descartar_tras_swipe_izquierda', async () => {
  const r1 = mockReceta({ id: 'receta-1', titulo: 'Tortilla' });
  const r2 = mockReceta({ id: 'receta-2', titulo: 'Paella' });
  mockService.obtenerFeed.mockResolvedValue({ recetas: [r1, r2], pagina: 0, totalPaginas: 1, hayMas: false });
  mockService.descartarReceta.mockReturnValue(new Promise(() => {})); // nunca se resuelve en el test

  const { getByText, getByTestId } = render(<FeedScreen />);
  await waitFor(() => expect(getByText('Tortilla')).toBeTruthy());

  fireEvent.press(getByTestId('swipe-descartar'));

  await waitFor(() => expect(getByText('Paella')).toBeTruthy());
  expect(useToastStore.getState().visible).toBe(false);
});

it('revierte_carta_si_api_falla', async () => {
  const r1 = mockReceta({ id: 'receta-1', titulo: 'Tortilla' });
  const r2 = mockReceta({ id: 'receta-2', titulo: 'Paella' });
  mockService.obtenerFeed.mockResolvedValue({ recetas: [r1, r2], pagina: 0, totalPaginas: 1, hayMas: false });
  mockService.guardarReceta.mockRejectedValue(new Error('Error de red'));

  const { getByText, queryByText, getByTestId } = render(<FeedScreen />);
  await waitFor(() => expect(getByText('Tortilla')).toBeTruthy());

  fireEvent.press(getByTestId('swipe-guardar'));
  expect(queryByText('Tortilla')).toBeNull();

  await waitFor(() => expect(getByText('Tortilla')).toBeTruthy());
  expect(useToastStore.getState().tipo).toBe('error');
  expect(useToastStore.getState().mensaje).toBe('Error de red');
});
