import React from 'react';
import { fireEvent, render, act, waitFor } from '@testing-library/react-native';
import { RecetasGuardadasScreen } from '@/screens/perfil/RecetasGuardadasScreen';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';
import { useRecetaStore } from '@/store/recetaStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/recetaService', () => ({
  recetaService: {
    recetasGuardadas: jest.fn(),
    eliminarGuardado: jest.fn(),
    marcarRealizada: jest.fn(),
    descontarStock: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

// GestureDetector se sustituye por un passthrough y Gesture.Pan() por un builder falso
// que expone onUpdate/onEnd en el orden en que se crean (uno por card renderizada), así
// se puede disparar el swipe de una card concreta sin simular touches nativos.
const mockPanGestures: any[] = [];

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: any) => children,
  Gesture: {
    Pan: () => {
      const gesture: any = {};
      gesture.activeOffsetX = () => gesture;
      gesture.onUpdate = (fn: any) => {
        gesture._onUpdate = fn;
        return gesture;
      };
      gesture.onEnd = (fn: any) => {
        gesture._onEnd = fn;
        return gesture;
      };
      mockPanGestures.push(gesture);
      return gesture;
    },
  },
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const { recetaService } = require('@/services/recetaService');

const MOCK_GUARDADAS = [
  { id: '1', autorId: 'u2', titulo: 'Pasta carbonara', descripcion: 'Cremosa', tiempoEstimado: 30, dificultad: 'Fácil', categoria: 'Pasta', etiquetas: [], estado: 'publicada', numPersonas: 2, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
  { id: '2', autorId: 'u3', titulo: 'Pollo al horno con verduras', descripcion: 'Saludable', tiempoEstimado: 60, dificultad: 'Media', categoria: 'Carnes', etiquetas: [], estado: 'publicada', numPersonas: 4, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockPanGestures.length = 0;
  useRecetaStore.setState({ recetasGuardadas: [], isLoading: false, error: null });
  useConfirmStore.setState({
    visible: false,
    title: '',
    message: undefined,
    icon: undefined,
    variant: 'default',
    buttons: [],
  });
  recetaService.recetasGuardadas.mockResolvedValue(MOCK_GUARDADAS);
  recetaService.eliminarGuardado.mockResolvedValue(undefined);
});

function renderPantalla() {
  return render(
    <>
      <RecetasGuardadasScreen />
      <ConfirmModal />
    </>
  );
}

it('renderiza_lista_de_recetas_guardadas_con_datos_reales', async () => {
  const { getByText } = renderPantalla();
  await waitFor(() => {
    expect(getByText('Pasta carbonara')).toBeTruthy();
    expect(getByText('Pollo al horno con verduras')).toBeTruthy();
  });
});

it('muestra_empty_state_con_boton_explorar_si_lista_vacia', async () => {
  recetaService.recetasGuardadas.mockResolvedValue([]);
  const { getByText } = renderPantalla();
  await waitFor(() => {
    expect(getByText('Aún no has guardado ninguna receta')).toBeTruthy();
    expect(getByText('Explorar recetas')).toBeTruthy();
  });
});

it('navega_a_Feed_al_pulsar_explorar_recetas', async () => {
  recetaService.recetasGuardadas.mockResolvedValue([]);
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Explorar recetas')).toBeTruthy());
  fireEvent.press(getByText('Explorar recetas'));
  expect(mockPush).toHaveBeenCalledWith('/(tabs)/feed');
});

it('navega_a_DetalleReceta_al_pulsar_item', async () => {
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());
  fireEvent.press(getByText('Pasta carbonara'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/receta/[id]', params: { id: '1' } });
});

it('swipe_izquierda_muestra_alert_confirmacion_eliminar', async () => {
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());

  act(() => {
    mockPanGestures[0]._onEnd({ translationX: -120 });
  });

  expect(getByText('¿Quitar "Pasta carbonara" de tus recetas guardadas?')).toBeTruthy();
});

it('elimina_receta_de_guardadas_tras_confirmar_swipe', async () => {
  const { getByText, getByTestId, queryByText } = renderPantalla();
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());

  act(() => {
    mockPanGestures[0]._onEnd({ translationX: -120 });
  });

  await act(async () => {
    fireEvent.press(getByTestId('confirm-modal-btn-1'));
  });

  expect(recetaService.eliminarGuardado).toHaveBeenCalledWith('1');
  await waitFor(() => expect(queryByText('Pasta carbonara')).toBeNull());
});

it('swipe_derecha_abre_modal_receta_realizada', async () => {
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());

  act(() => {
    mockPanGestures[0]._onEnd({ translationX: 120 });
  });

  expect(getByText('¿Cuántas raciones has preparado?')).toBeTruthy();
  expect(getByText('Esta receta es para 2 personas')).toBeTruthy();
});

it('swipe_corto_no_activa_accion', async () => {
  const { getByText, queryByText } = renderPantalla();
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());

  act(() => {
    mockPanGestures[0]._onEnd({ translationX: 50 });
  });

  expect(queryByText('¿Quitar "Pasta carbonara" de tus recetas guardadas?')).toBeNull();
  expect(queryByText('¿Cuántas raciones has preparado?')).toBeNull();
});

it('actualiza_lista_al_hacer_pull_to_refresh', async () => {
  const { UNSAFE_getByType, getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Pasta carbonara')).toBeTruthy());
  const { FlatList } = require('react-native');
  const flatList = UNSAFE_getByType(FlatList);
  await act(async () => {
    await flatList.props.refreshControl.props.onRefresh();
  });
  expect(recetaService.recetasGuardadas).toHaveBeenCalledTimes(2);
  expect(flatList.props.data.length).toBeGreaterThan(0);
});
