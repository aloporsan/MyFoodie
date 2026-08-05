import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { FormProductoScreen } from '@/screens/despensa/FormProductoScreen';
import { useDespensaStore } from '@/store/despensaStore';
import { useLocalSearchParams, useRouter } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/store/despensaStore', () => ({ useDespensaStore: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockBack          = jest.fn();
const mockAñadirProducto = jest.fn();
const mockEditarProducto = jest.fn();

const storeBase = {
  productos: [],
  isLoading: false,
  añadirProducto: mockAñadirProducto,
  editarProducto: mockEditarProducto,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: jest.fn() });
  (useLocalSearchParams as jest.Mock).mockReturnValue({});
  (useDespensaStore as unknown as jest.Mock).mockReturnValue(storeBase);
});

// -------------------------------------------------------------------------
// positivos
// -------------------------------------------------------------------------

it('renderiza_el_titulo_Nuevo_producto_en_modo_añadir', () => {
  const { getByText } = render(<FormProductoScreen />);
  expect(getByText('Nuevo producto')).toBeTruthy();
});

it('renderiza_el_titulo_Editar_producto_en_modo_edicion', () => {
  const mockProducto = {
    id: 'prod-1',
    despensaId: 'desp-1',
    nombre: 'Leche',
    cantidad: 2,
    unidad: 'litros',
    estado: 'normal' as const,
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-01T10:00:00',
  };
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'prod-1' });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [mockProducto],
  });

  const { getByText } = render(<FormProductoScreen />);
  expect(getByText('Editar producto')).toBeTruthy();
});

it('rellena_campos_con_datos_del_producto_en_modo_edicion', () => {
  const mockProducto = {
    id: 'prod-1',
    despensaId: 'desp-1',
    nombre: 'Aceite',
    cantidad: 1,
    unidad: 'litros',
    marca: 'Hacendado',
    estado: 'normal' as const,
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-01T10:00:00',
  };
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'prod-1' });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [mockProducto],
  });

  const { getByDisplayValue } = render(<FormProductoScreen />);
  expect(getByDisplayValue('Aceite')).toBeTruthy();
  expect(getByDisplayValue('Hacendado')).toBeTruthy();
});

it('navega_atras_tras_guardar_exitoso', async () => {
  mockAñadirProducto.mockResolvedValue({
    id: 'prod-nuevo',
    despensaId: 'desp-1',
    nombre: 'Leche',
    cantidad: 2,
    unidad: 'litros',
    estado: 'normal',
    createdAt: '2026-01-01T10:00:00',
    updatedAt: '2026-01-01T10:00:00',
  });

  const { getByPlaceholderText, getByText } = render(<FormProductoScreen />);
  fireEvent.changeText(getByPlaceholderText('ej. Leche entera'), 'Leche');
  fireEvent.changeText(getByPlaceholderText('ej. 2'), '2');
  fireEvent.press(getByText('Añadir producto'));

  await waitFor(() => {
    expect(mockAñadirProducto).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------------
// negativos (validaciones)
// -------------------------------------------------------------------------

it('boton_guardar_no_llama_al_servicio_si_nombre_vacio', async () => {
  const { getByPlaceholderText, getByText } = render(<FormProductoScreen />);
  fireEvent.changeText(getByPlaceholderText('ej. 2'), '2');
  fireEvent.press(getByText('Añadir producto'));

  await waitFor(() => {
    expect(mockAñadirProducto).not.toHaveBeenCalled();
  });
  expect(getByText('El nombre es obligatorio')).toBeTruthy();
});

it('boton_guardar_no_llama_al_servicio_si_cantidad_invalida', async () => {
  const { getByPlaceholderText, getByText } = render(<FormProductoScreen />);
  fireEvent.changeText(getByPlaceholderText('ej. Leche entera'), 'Leche');
  fireEvent.changeText(getByPlaceholderText('ej. 2'), 'abc');
  fireEvent.press(getByText('Añadir producto'));

  await waitFor(() => {
    expect(mockAñadirProducto).not.toHaveBeenCalled();
  });
  expect(getByText('Cantidad válida requerida')).toBeTruthy();
});

// -------------------------------------------------------------------------
// MEJORA 1 — Stock mínimo personalizado (#132)
// -------------------------------------------------------------------------

it('renderiza_campo_stock_minimo_personalizado', () => {
  const { getByText, getByPlaceholderText } = render(<FormProductoScreen />);
  expect(getByText('Stock mínimo personalizado')).toBeTruthy();
  expect(getByPlaceholderText('ej. 3')).toBeTruthy();
});

it('stock_minimo_cero_es_aceptado_como_valor_valido', async () => {
  mockAñadirProducto.mockResolvedValue({
    id: 'prod-1', despensaId: 'desp-1', nombre: 'Leche', cantidad: 2,
    unidad: 'unidades', estado: 'normal', createdAt: '', updatedAt: '',
  });
  const { getByPlaceholderText, getByText } = render(<FormProductoScreen />);
  fireEvent.changeText(getByPlaceholderText('ej. Leche entera'), 'Leche');
  fireEvent.changeText(getByPlaceholderText('ej. 2'), '2');
  fireEvent.changeText(getByPlaceholderText('ej. 3'), '0');
  fireEvent.press(getByText('Añadir producto'));

  await waitFor(() => {
    expect(mockAñadirProducto).toHaveBeenCalledWith(expect.objectContaining({ stockMinimo: 0 }));
  });
});

it('boton_guardar_no_queda_deshabilitado_al_escribir_stock_minimo_valido', async () => {
  mockAñadirProducto.mockResolvedValue({
    id: 'prod-1', despensaId: 'desp-1', nombre: 'Leche', cantidad: 2,
    unidad: 'litros', estado: 'normal', createdAt: '', updatedAt: '',
  });
  const { getByPlaceholderText, getByText } = render(<FormProductoScreen />);
  fireEvent.changeText(getByPlaceholderText('ej. Leche entera'), 'Leche');
  fireEvent.changeText(getByPlaceholderText('ej. 2'), '2');
  fireEvent.changeText(getByPlaceholderText('ej. 3'), '3');
  fireEvent.press(getByText('Añadir producto'));

  await waitFor(() => {
    expect(mockAñadirProducto).toHaveBeenCalled();
  });
});

it('rellena_stock_minimo_en_modo_edicion_si_el_producto_lo_tiene', () => {
  const mockProducto = {
    id: 'prod-1', despensaId: 'desp-1', nombre: 'Sal', cantidad: 1,
    unidad: 'kg', stockMinimo: 3, estado: 'normal' as const,
    createdAt: '', updatedAt: '',
  };
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'prod-1' });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [mockProducto],
  });
  const { getByDisplayValue } = render(<FormProductoScreen />);
  expect(getByDisplayValue('3')).toBeTruthy();
});
