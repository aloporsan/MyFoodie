import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FormProductoScreen } from '@/screens/despensa/FormProductoScreen';
import { useDespensaStore } from '@/store/despensaStore';
import { useLocalSearchParams, useRouter } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({ useRouter: jest.fn(), useLocalSearchParams: jest.fn() }));
jest.mock('@/store/despensaStore', () => ({ useDespensaStore: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockAñadirProducto = jest.fn().mockResolvedValue({ posiblesDuplicados: [] });
const mockBuscarSimilares = jest.fn();

const productoSimilar = (id: string, nombre: string, similitud: number, tipoMatch: 'AUTOMATICO' | 'PROPONER') => ({
  producto: {
    id,
    despensaId: 'desp-1',
    nombre,
    cantidad: 1,
    unidad: 'unidad',
    estado: 'normal' as const,
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-01T10:00:00',
  },
  similitud,
  tipoMatch,
  textoSugerido: `¿Es lo mismo que '${nombre}' en tu despensa?`,
});

// El store mockeado es "con estado": limpiarSimilares muta similaresSugeridosState, y
// useDespensaStore se implementa como función (no mockReturnValue) para leer siempre el
// valor actual en cada render, igual que ocurriría con la store real de zustand.
let similaresSugeridosState: ReturnType<typeof productoSimilar>[] = [];
const mockLimpiarSimilares = jest.fn(() => { similaresSugeridosState = []; });

function mockStore() {
  (useDespensaStore as unknown as jest.Mock).mockImplementation(() => ({
    productos: [],
    añadirProducto: mockAñadirProducto,
    editarProducto: jest.fn(),
    actualizarCantidad: jest.fn(),
    isLoading: false,
    similaresSugeridos: similaresSugeridosState,
    buscarSimilares: mockBuscarSimilares,
    limpiarSimilares: mockLimpiarSimilares,
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  similaresSugeridosState = [];
  mockAñadirProducto.mockResolvedValue({ posiblesDuplicados: [] });
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  mockStore();
});

afterEach(() => {
  jest.useRealTimers();
});

it('escribir_el_nombre_dispara_buscarSimilares_tras_el_debounce', () => {
  const { getByPlaceholderText } = render(<FormProductoScreen />);

  fireEvent.changeText(getByPlaceholderText('ej. Leche entera'), 'aceitunas gordales');
  jest.advanceTimersByTime(500);

  expect(mockBuscarSimilares).toHaveBeenCalledWith('aceitunas gordales');
});

it('un_match_automatico_no_bloquea_ni_autoselecciona_el_campo_de_nombre', () => {
  similaresSugeridosState = [productoSimilar('p1', 'Aceitunas Gordales', 0.95, 'AUTOMATICO')];
  const { getByPlaceholderText, queryByText } = render(<FormProductoScreen />);

  const input = getByPlaceholderText('ej. Leche entera');
  expect(input.props.editable).not.toBe(false);
  // Nada se autoselecciona: el usuario sigue escribiendo libremente, sin banner de "Actualizando cantidad de".
  expect(queryByText(/Actualizando cantidad de/)).toBeNull();

  fireEvent.changeText(input, 'aceitunas gordales rellenas');
  expect(input.props.value).toBe('aceitunas gordales rellenas');
});

it('muestra_las_sugerencias_con_los_AUTOMATICO_primero', () => {
  similaresSugeridosState = [
    productoSimilar('p1', 'Tomate', 0.65, 'PROPONER'),
    productoSimilar('p2', 'Tomate frito', 0.9, 'AUTOMATICO'),
  ];
  const { getByText } = render(<FormProductoScreen />);

  expect(getByText('¿Es uno de estos?')).toBeTruthy();
  expect(getByText('90%')).toBeTruthy();
  expect(getByText('65%')).toBeTruthy();
});

it('tocar_una_sugerencia_la_selecciona_y_bloquea_el_campo_de_nombre', () => {
  similaresSugeridosState = [productoSimilar('p1', 'Aceitunas Gordales', 0.95, 'AUTOMATICO')];
  const { getByText, getByPlaceholderText } = render(<FormProductoScreen />);

  fireEvent.press(getByText('Aceitunas Gordales'));

  expect(getByText('Actualizando cantidad de "Aceitunas Gordales"')).toBeTruthy();
  expect(getByPlaceholderText('ej. Leche entera').props.editable).toBe(false);
  expect(mockLimpiarSimilares).toHaveBeenCalled();
});

it('descartar_las_sugerencias_con_la_X_las_oculta_y_no_vuelven_a_aparecer_al_seguir_escribiendo', () => {
  similaresSugeridosState = [productoSimilar('p1', 'Aceitunas Gordales', 0.95, 'AUTOMATICO')];
  const { getByText, queryByText, getByPlaceholderText, getByTestId } = render(<FormProductoScreen />);

  expect(getByText('¿Es uno de estos?')).toBeTruthy();

  fireEvent.press(getByTestId('descartar-sugerencias'));

  expect(queryByText('¿Es uno de estos?')).toBeNull();

  mockBuscarSimilares.mockClear();
  fireEvent.changeText(getByPlaceholderText('ej. Leche entera'), 'aceitunas gordales rellenas');
  jest.advanceTimersByTime(500);

  expect(mockBuscarSimilares).not.toHaveBeenCalled();
});

it('quitar_la_seleccion_desbloquea_el_campo_pero_no_vuelve_a_buscar_similares', () => {
  similaresSugeridosState = [productoSimilar('p1', 'Aceitunas Gordales', 0.95, 'AUTOMATICO')];
  const { getByText, getByPlaceholderText, queryByText, getByTestId } = render(<FormProductoScreen />);

  fireEvent.press(getByText('Aceitunas Gordales'));
  expect(getByPlaceholderText('ej. Leche entera').props.editable).toBe(false);

  fireEvent.press(getByTestId('quitar-seleccion'));

  expect(queryByText(/Actualizando cantidad de/)).toBeNull();
  expect(getByPlaceholderText('ej. Leche entera').props.editable).not.toBe(false);

  mockBuscarSimilares.mockClear();
  fireEvent.changeText(getByPlaceholderText('ej. Leche entera'), 'otra cosa distinta');
  jest.advanceTimersByTime(500);

  expect(mockBuscarSimilares).not.toHaveBeenCalled();
});
