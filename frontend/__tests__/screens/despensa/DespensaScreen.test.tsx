import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DespensaScreen } from '@/screens/despensa/DespensaScreen';
import { useDespensaStore } from '@/store/despensaStore';
import { useRouter } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/store/despensaStore', () => ({ useDespensaStore: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockPush = jest.fn();
const mockCargarProductos  = jest.fn();
const mockActualizarCantidad = jest.fn();
const mockEliminarProducto = jest.fn();
const mockSetBusqueda      = jest.fn();
const mockSetFiltros       = jest.fn();
const mockLimpiarFiltros   = jest.fn();

const mockProducto = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Leche Entera',
  cantidad: 2,
  unidad: 'litros',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const storeBase = {
  productos: [],
  isLoading: false,
  busquedaActiva: '',
  cargarProductos: mockCargarProductos,
  actualizarCantidad: mockActualizarCantidad,
  eliminarProducto: mockEliminarProducto,
  setBusqueda: mockSetBusqueda,
  setFiltros: mockSetFiltros,
  limpiarFiltros: mockLimpiarFiltros,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: jest.fn() });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue(storeBase);
});

// -------------------------------------------------------------------------
// positivos
// -------------------------------------------------------------------------

it('renderiza_titulo_Mi_despensa', () => {
  const { getByText } = render(<DespensaScreen />);
  expect(getByText('Mi despensa')).toBeTruthy();
});

it('muestra_estado_vacio_si_no_hay_productos', () => {
  const { getByText } = render(<DespensaScreen />);
  expect(getByText('Tu despensa está vacía')).toBeTruthy();
});

it('renderiza_lista_de_productos_cuando_hay_productos', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [mockProducto],
  });
  const { getByText } = render(<DespensaScreen />);
  expect(getByText('Leche Entera')).toBeTruthy();
});

it('navega_a_form_al_pulsar_el_boton_añadir_del_estado_vacio', () => {
  const { getByText } = render(<DespensaScreen />);
  fireEvent.press(getByText('Añadir producto'));
  expect(mockPush).toHaveBeenCalledWith('/despensa/form');
});

it('llama_cargarProductos_al_montar_el_componente', async () => {
  render(<DespensaScreen />);
  await waitFor(() => {
    expect(mockCargarProductos).toHaveBeenCalledTimes(1);
  });
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('muestra_estado_vacio_de_busqueda_si_hay_busqueda_activa_sin_resultados', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [],
    busquedaActiva: 'pepino',
  });
  const { getByText } = render(<DespensaScreen />);
  expect(getByText('Sin resultados')).toBeTruthy();
});
