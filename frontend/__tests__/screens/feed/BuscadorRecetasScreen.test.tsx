import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { BuscadorRecetasScreen } from '@/screens/feed/BuscadorRecetasScreen';
import { feedService, RecetaFeed } from '@/services/feedService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));
jest.mock('@/services/apiClient', () => ({ apiClient: { get: jest.fn() }, setTokenGetter: jest.fn() }));
jest.mock('@/services/feedService');
jest.mock('@/components/common/LoadingScreen', () => ({ LoadingScreen: () => null }));

// Stub del panel de filtros: expone un botón que aplica { soloDespensa: true }.
jest.mock('@/components/feed', () => {
  const { Pressable, Text } = require('react-native');
  return {
    FiltrosRecetaSheet: ({ onAplicar }: { onAplicar: (f: unknown) => void }) => (
      <Pressable
        testID="stub-aplicar-solo-despensa"
        onPress={() =>
          onAplicar({
            categorias: [],
            dificultades: [],
            etiquetas: [],
            tiempos: [],
            personas: [],
            soloDespensa: true,
          })
        }
      >
        <Text>stub</Text>
      </Pressable>
    ),
  };
});

const mockFeed = feedService as jest.Mocked<typeof feedService>;

const receta = (o: Partial<RecetaFeed> = {}): RecetaFeed => ({
  id: 'r1',
  titulo: 'Tortilla de patatas',
  autorId: 'a1',
  tiempoEstimado: 20,
  dificultad: 'Fácil',
  categoria: 'Almuerzo',
  numPersonas: 2,
  etiquetas: [],
  likes: 0,
  yaLike: false,
  yaGuardada: false,
  coincidenciaDespensa: 100,
  ingredientesDisponibles: 2,
  ingredientesFaltantes: 0,
  createdAt: '2026-01-01T10:00:00',
  ...o,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

it('renderiza_sin_toggle_de_usuarios_ni_etiquetas_populares', () => {
  const { getByTestId, getByText, queryByText } = render(<BuscadorRecetasScreen />);

  expect(getByTestId('input-buscar-recetas')).toBeTruthy();
  expect(getByText('Busca recetas')).toBeTruthy();
  expect(queryByText('Etiquetas populares')).toBeNull();
  expect(queryByText('Usuarios')).toBeNull();
});

it('busca_debounced_al_escribir', async () => {
  mockFeed.buscarRecetas.mockResolvedValue([receta({ titulo: 'Gazpacho andaluz' })]);
  const { getByTestId, findByText } = render(<BuscadorRecetasScreen />);

  fireEvent.changeText(getByTestId('input-buscar-recetas'), 'gazpacho');
  expect(mockFeed.buscarRecetas).not.toHaveBeenCalled();

  act(() => jest.advanceTimersByTime(400));

  expect(mockFeed.buscarRecetas).toHaveBeenCalledWith('gazpacho', expect.anything());
  expect(await findByText('Gazpacho andaluz')).toBeTruthy();
});

it('no_dispara_la_busqueda_antes_de_los_400ms', () => {
  mockFeed.buscarRecetas.mockResolvedValue([]);
  const { getByTestId } = render(<BuscadorRecetasScreen />);

  fireEvent.changeText(getByTestId('input-buscar-recetas'), 'x');
  act(() => jest.advanceTimersByTime(200));

  expect(mockFeed.buscarRecetas).not.toHaveBeenCalled();
});

it('muestra_estado_vacio_cuando_no_hay_resultados', async () => {
  mockFeed.buscarRecetas.mockResolvedValue([]);
  const { getByTestId, findByText } = render(<BuscadorRecetasScreen />);

  fireEvent.changeText(getByTestId('input-buscar-recetas'), 'zzz');
  act(() => jest.advanceTimersByTime(400));

  expect(await findByText('Sin resultados')).toBeTruthy();
});

it('la_card_muestra_dificultad_categoria_y_personas', async () => {
  mockFeed.buscarRecetas.mockResolvedValue([
    receta({ titulo: 'Plato test', dificultad: 'Media', categoria: 'Cena', numPersonas: 4 }),
  ]);
  const { getByTestId, findByText, getByText } = render(<BuscadorRecetasScreen />);

  fireEvent.changeText(getByTestId('input-buscar-recetas'), 'plato');
  act(() => jest.advanceTimersByTime(400));

  expect(await findByText('Media')).toBeTruthy();
  expect(getByText('Cena')).toBeTruthy();
  expect(getByText('4')).toBeTruthy();
  expect(getByText('Tienes los ingredientes')).toBeTruthy();
});

it('el_switch_solo_despensa_filtra_los_resultados_en_cliente', async () => {
  mockFeed.buscarRecetas.mockResolvedValue([
    receta({ id: 'full', titulo: 'Puedo cocinarla', coincidenciaDespensa: 100, ingredientesFaltantes: 0 }),
    receta({
      id: 'poca',
      titulo: 'Me faltan cosas',
      coincidenciaDespensa: 20,
      ingredientesDisponibles: 0,
      ingredientesFaltantes: 5,
    }),
  ]);
  const { getByTestId, findByText, getByText, queryByText } = render(<BuscadorRecetasScreen />);

  fireEvent.changeText(getByTestId('input-buscar-recetas'), 'algo');
  act(() => jest.advanceTimersByTime(400));

  expect(await findByText('Puedo cocinarla')).toBeTruthy();
  expect(getByText('Me faltan cosas')).toBeTruthy();

  fireEvent.press(getByTestId('stub-aplicar-solo-despensa'));
  act(() => jest.advanceTimersByTime(400));

  await waitFor(() => expect(queryByText('Me faltan cosas')).toBeNull());
  expect(getByText('Puedo cocinarla')).toBeTruthy();
});
