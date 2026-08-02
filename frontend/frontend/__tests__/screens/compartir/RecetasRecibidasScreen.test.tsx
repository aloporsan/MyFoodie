import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import { RecetasRecibidasScreen } from '@/screens/compartir/RecetasRecibidasScreen';
import { RecetaCompartida, compartirService } from '@/services/compartirService';
import { useCompartirStore } from '@/store/compartirStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/compartirService');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

const mockCompartirService = compartirService as jest.Mocked<typeof compartirService>;

function recetaCompartida(overrides: Partial<RecetaCompartida> = {}): RecetaCompartida {
  return {
    id: 'comp-1',
    emisor: { nombre: 'Ana García', nombreUsuario: 'anagarcia', fotoPerfil: null },
    receta: {
      id: 'receta-1',
      autorId: 'user-1',
      titulo: 'Ensalada de tomate',
      descripcion: 'Fresca y rápida',
      tiempoEstimado: 10,
      dificultad: 'facil',
      categoria: 'entrante',
      etiquetas: [],
      estado: 'publicada',
      ingredientes: [],
      pasos: [],
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    },
    mensaje: null,
    leida: false,
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useCompartirStore.setState({ recetasRecibidas: [], contadorNoLeidas: 0, isLoading: false, error: null });
  mockCompartirService.marcarComoLeida.mockResolvedValue(undefined);
  mockCompartirService.obtenerContador.mockResolvedValue(0);
});

it('renderiza_lista_de_recetas_recibidas', async () => {
  mockCompartirService.obtenerRecibidas.mockResolvedValue([recetaCompartida()]);
  const { findByText } = render(<RecetasRecibidasScreen />);

  expect(await findByText('Ensalada de tomate')).toBeTruthy();
});

it('muestra_empty_state_si_lista_vacia', async () => {
  mockCompartirService.obtenerRecibidas.mockResolvedValue([]);
  const { findByText } = render(<RecetasRecibidasScreen />);

  expect(await findByText('Aún no te han compartido ninguna receta')).toBeTruthy();
});

it('marca_todas_como_leidas_al_entrar', async () => {
  mockCompartirService.obtenerRecibidas.mockResolvedValue([recetaCompartida({ id: 'comp-1', leida: false })]);
  render(<RecetasRecibidasScreen />);

  await waitFor(() => {
    expect(mockCompartirService.marcarComoLeida).toHaveBeenCalledWith('comp-1');
  });
});

it('actualiza_lista_al_hacer_pull_to_refresh', async () => {
  mockCompartirService.obtenerRecibidas.mockResolvedValue([recetaCompartida()]);
  const { UNSAFE_getByType, findByText } = render(<RecetasRecibidasScreen />);
  await findByText('Ensalada de tomate');

  const { FlatList } = require('react-native');
  const flatList = UNSAFE_getByType(FlatList);
  await act(async () => {
    await flatList.props.refreshControl.props.onRefresh();
  });

  expect(mockCompartirService.obtenerRecibidas).toHaveBeenCalledTimes(2);
});
