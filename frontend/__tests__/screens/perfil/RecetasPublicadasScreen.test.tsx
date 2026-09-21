import React from 'react';
import { fireEvent, render, act, waitFor } from '@testing-library/react-native';
import { RecetasPublicadasScreen } from '@/screens/perfil/RecetasPublicadasScreen';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';
import { useRecetaStore } from '@/store/recetaStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/recetaService', () => ({
  recetaService: { misRecetas: jest.fn(), eliminarReceta: jest.fn() },
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

const MOCK_RECETAS = [
  { id: '1', autorId: 'u1', titulo: 'Tortilla española clásica', descripcion: 'Clásica', tiempoEstimado: 25, dificultad: 'Fácil', categoria: 'Huevos', etiquetas: [], estado: 'publicada', totalLikes: 3, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
  { id: '2', autorId: 'u1', titulo: 'Lentejas con chorizo', descripcion: 'Contundente', tiempoEstimado: 50, dificultad: 'Fácil', categoria: 'Legumbres', etiquetas: [], estado: 'borrador', totalLikes: 0, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
  { id: '3', autorId: 'u1', titulo: 'Paella valenciana', descripcion: 'Tradicional', tiempoEstimado: 90, dificultad: 'Difícil', categoria: 'Arroces', etiquetas: [], estado: 'publicada', totalLikes: 12, ingredientes: [], pasos: [], createdAt: '', updatedAt: '' },
];

const mockPush = jest.fn();
const mockBack = jest.fn();
const { useRouter } = require('expo-router');
const { recetaService } = require('@/services/recetaService');

function renderPantalla() {
  return render(
    <>
      <RecetasPublicadasScreen />
      <ConfirmModal />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPanGestures.length = 0;
  useRouter.mockReturnValue({ push: mockPush, back: mockBack });
  useRecetaStore.setState({ recetas: [], isLoading: false, error: null });
  useConfirmStore.setState({
    visible: false,
    title: '',
    message: undefined,
    icon: undefined,
    variant: 'default',
    buttons: [],
  });
  recetaService.misRecetas.mockResolvedValue(MOCK_RECETAS);
  recetaService.eliminarReceta.mockResolvedValue(undefined);
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

it('swipe_izquierda_muestra_alert_confirmacion_eliminar', async () => {
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Tortilla española clásica')).toBeTruthy());

  act(() => {
    mockPanGestures[0]._onEnd({ translationX: -120 });
  });

  expect(
    getByText('¿Seguro que quieres eliminar "Tortilla española clásica"? Esta acción no se puede deshacer.')
  ).toBeTruthy();
});

it('elimina_receta_desde_Mis_recetas_tras_confirmar_swipe', async () => {
  const { getByText, getByTestId, queryByText } = renderPantalla();
  await waitFor(() => expect(getByText('Tortilla española clásica')).toBeTruthy());

  act(() => {
    mockPanGestures[0]._onEnd({ translationX: -120 });
  });

  await act(async () => {
    fireEvent.press(getByTestId('confirm-modal-btn-1'));
  });

  expect(recetaService.eliminarReceta).toHaveBeenCalledWith('1');
  await waitFor(() => expect(queryByText('Tortilla española clásica')).toBeNull());
});

it('swipe_corto_no_activa_el_borrado', async () => {
  const { getByText, queryByText } = renderPantalla();
  await waitFor(() => expect(getByText('Tortilla española clásica')).toBeTruthy());

  act(() => {
    mockPanGestures[0]._onEnd({ translationX: -50 });
  });

  expect(
    queryByText('¿Seguro que quieres eliminar "Tortilla española clásica"? Esta acción no se puede deshacer.')
  ).toBeNull();
});
