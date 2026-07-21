import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DetalleProductoScreen } from '@/screens/despensa/DetalleProductoScreen';
import { useDespensaStore } from '@/store/despensaStore';
import { useLocalSearchParams, useRouter } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  useFocusEffect: (cb: () => void) => cb(),
}));
jest.mock('@/store/despensaStore', () => ({ useDespensaStore: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockActualizarCantidad = jest.fn();
const mockEliminarProducto = jest.fn();
const mockCargarHistorial = jest.fn();

const mockProducto = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Leche Entera',
  cantidad: 3,
  unidad: 'litros',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const mockHistorial = [
  {
    id: 'mov-1',
    tipo: 'cantidad_actualizada' as const,
    descripcion: 'Cantidad actualizada',
    cantidadAnterior: 5,
    cantidadNueva: 3,
    motivo: 'consumido' as const,
    motivoDetalle: null,
    createdAt: '2026-01-02T10:00:00',
  },
];

const storeBase = {
  productos: [mockProducto],
  historialProducto: mockHistorial,
  actualizarCantidad: mockActualizarCantidad,
  eliminarProducto: mockEliminarProducto,
  cargarHistorial: mockCargarHistorial,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'prod-1' });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue(storeBase);
});

// -------------------------------------------------------------------------
// positivos
// -------------------------------------------------------------------------

it('renderiza_el_nombre_del_producto', () => {
  const { getAllByText } = render(<DetalleProductoScreen />);
  expect(getAllByText('Leche Entera').length).toBeGreaterThan(0);
});

it('llama_cargarHistorial_al_ganar_foco', () => {
  render(<DetalleProductoScreen />);
  expect(mockCargarHistorial).toHaveBeenCalledWith('prod-1');
});

it('renderiza_el_historial_con_delta_chip_negativo', () => {
  const { getByText } = render(<DetalleProductoScreen />);
  expect(getByText('Historial')).toBeTruthy();
  expect(getByText('-2')).toBeTruthy();
});

it('renderiza_delta_chip_positivo_cuando_la_cantidad_aumenta', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    historialProducto: [
      { ...mockHistorial[0], cantidadAnterior: 1, cantidadNueva: 4 },
    ],
  });
  const { getByText } = render(<DetalleProductoScreen />);
  expect(getByText('+3')).toBeTruthy();
});

it('no_renderiza_seccion_historial_si_esta_vacio', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    historialProducto: [],
  });
  const { queryByText } = render(<DetalleProductoScreen />);
  expect(queryByText('Historial')).toBeNull();
});

it('abre_CantidadMotivoSheet_en_modo_restar_al_pulsar_menos', () => {
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);
  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMenos = iconos.find((i: any) => i.props.name === 'remove');
  fireEvent.press(btnMenos!.parent as any);
  expect(getByText('¿Cuánto has usado?')).toBeTruthy();
});

it('abre_CantidadMotivoSheet_en_modo_sumar_al_pulsar_mas', () => {
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);
  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMas = iconos.find((i: any) => i.props.name === 'add');
  fireEvent.press(btnMas!.parent as any);
  expect(getByText('¿Cuánto añades?')).toBeTruthy();
});

it('confirmar_sheet_en_modo_sumar_llama_actualizarCantidad_con_delta_positivo', async () => {
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);
  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMas = iconos.find((i: any) => i.props.name === 'add');
  fireEvent.press(btnMas!.parent as any);
  fireEvent.press(getByText('Añadir'));
  await waitFor(() => {
    expect(mockActualizarCantidad).toHaveBeenCalledWith('prod-1', 1, undefined, undefined);
  });
});

it('abre_modal_de_motivo_al_pulsar_eliminar_producto', () => {
  const { getByText } = render(<DetalleProductoScreen />);
  fireEvent.press(getByText('Eliminar producto'));
  expect(getByText('¿Por qué eliminas este producto?')).toBeTruthy();
});

it('confirmar_eliminacion_con_motivo_llama_eliminarProducto_y_vuelve_atras', async () => {
  const { getByText } = render(<DetalleProductoScreen />);
  fireEvent.press(getByText('Eliminar producto'));
  fireEvent.press(getByText('Caducado'));
  fireEvent.press(getByText('Eliminar'));
  await waitFor(() => {
    expect(mockEliminarProducto).toHaveBeenCalledWith('prod-1', 'caducado', undefined);
    expect(mockBack).toHaveBeenCalled();
  });
});

it('boton_eliminar_del_modal_esta_deshabilitado_sin_motivo_seleccionado', async () => {
  const { getByText } = render(<DetalleProductoScreen />);
  fireEvent.press(getByText('Eliminar producto'));
  fireEvent.press(getByText('Eliminar'));
  await waitFor(() => {
    expect(mockEliminarProducto).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('muestra_producto_no_encontrado_si_el_id_no_coincide', () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'no-existe' });
  const { getByText } = render(<DetalleProductoScreen />);
  expect(getByText('Producto no encontrado')).toBeTruthy();
});
