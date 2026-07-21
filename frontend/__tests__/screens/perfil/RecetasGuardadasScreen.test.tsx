import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, act, waitFor } from '@testing-library/react-native';
import { RecetasGuardadasScreen } from '@/screens/perfil/RecetasGuardadasScreen';
import { useRecetaStore } from '@/store/recetaStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/recetaService', () => ({
  recetaService: { recetasGuardadas: jest.fn(), eliminarGuardado: jest.fn() },
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

const { recetaService } = require('@/services/recetaService');

const MOCK_GUARDADAS = [
  { id: '1', autorId: 'u2', titulo: 'Pasta carbonara', descripcion: 'Cremosa', tiempoEstimado: 30, dificultad: 'Fácil', categoria: 'Pasta', etiquetas: [], estado: 'publicada', ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
  { id: '2', autorId: 'u3', titulo: 'Pollo al horno con verduras', descripcion: 'Saludable', tiempoEstimado: 60, dificultad: 'Media', categoria: 'Carnes', etiquetas: [], estado: 'publicada', ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
];

beforeEach(() => {
  jest.clearAllMocks();
  useRecetaStore.setState({ recetasGuardadas: [], isLoading: false, error: null });
  recetaService.recetasGuardadas.mockResolvedValue(MOCK_GUARDADAS);
  recetaService.eliminarGuardado.mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert');
});

it('renderiza_lista_de_recetas_guardadas_con_datos_reales', async () => {
  const { getByText } = render(<RecetasGuardadasScreen />);
  await waitFor(() => {
    expect(getByText('Pasta carbonara')).toBeTruthy();
    expect(getByText('Pollo al horno con verduras')).toBeTruthy();
  });
});

it('muestra_empty_state_con_boton_explorar_si_lista_vacia', async () => {
  recetaService.recetasGuardadas.mockResolvedValue([]);
  const { getByText } = render(<RecetasGuardadasScreen />);
  await waitFor(() => {
    expect(getByText('Aún no has guardado ninguna receta')).toBeTruthy();
    expect(getByText('Explorar recetas')).toBeTruthy();
  });
});

it('navega_a_Feed_al_pulsar_explorar_recetas', async () => {
  recetaService.recetasGuardadas.mockResolvedValue([]);
  const { getByText } = render(<RecetasGuardadasScreen />);
  await waitFor(() => expect(getByText('Explorar recetas')).toBeTruthy());
  fireEvent.press(getByText('Explorar recetas'));
  expect(mockPush).toHaveBeenCalledWith('/(tabs)/feed');
});

it('navega_a_DetalleReceta_al_pulsar_item', async () => {
  const { getByText } = render(<RecetasGuardadasScreen />);
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());
  fireEvent.press(getByText('Pasta carbonara'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/receta/[id]', params: { id: '1' } });
});

it('muestra_alert_confirmacion_al_pulsar_quitar_guardado', async () => {
  const { getByText, getAllByText } = render(<RecetasGuardadasScreen />);
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());
  fireEvent.press(getAllByText('Quitar de guardados')[0]);
  expect(Alert.alert).toHaveBeenCalledWith(
    'Quitar de guardados',
    expect.stringContaining('Pasta carbonara'),
    expect.any(Array)
  );
});

it('elimina_receta_de_guardadas_tras_confirmar', async () => {
  (Alert.alert as jest.Mock).mockImplementation((_title, _msg, buttons) => {
    buttons?.[1]?.onPress?.();
  });
  const { getByText, getAllByText, queryByText } = render(<RecetasGuardadasScreen />);
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());

  await act(async () => {
    fireEvent.press(getAllByText('Quitar de guardados')[0]);
  });

  expect(recetaService.eliminarGuardado).toHaveBeenCalledWith('1');
  await waitFor(() => expect(queryByText('Pasta carbonara')).toBeNull());
});

it('actualiza_lista_al_hacer_pull_to_refresh', async () => {
  const { UNSAFE_getByType, getByText } = render(<RecetasGuardadasScreen />);
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());
  const { FlatList } = require('react-native');
  const flatList = UNSAFE_getByType(FlatList);
  await act(async () => {
    await flatList.props.refreshControl.props.onRefresh();
  });
  expect(recetaService.recetasGuardadas).toHaveBeenCalledTimes(2);
  expect(flatList.props.data.length).toBeGreaterThan(0);
});
