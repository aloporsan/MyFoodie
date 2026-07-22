import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ListaFiltradaScreen } from '@/screens/despensa/ListaFiltradaScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { despensaService } from '@/services/despensaService';
import { useDespensaStore } from '@/store/despensaStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/services/despensaService');
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/store/despensaStore', () => ({ useDespensaStore: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@/utils/categoriaConfig', () => ({
  getCategoriaConfig: () => ({ icon: 'basket-outline', bg: '#F2F2F2', fg: '#757575' }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockEliminarProducto = jest.fn();
const mockService = despensaService as jest.Mocked<typeof despensaService>;

const productoBase = {
  id: 'prod-1', despensaId: 'desp-1', nombre: 'Yogur', cantidad: 1,
  unidad: 'unidades', estado: 'caducado' as const,
  createdAt: '2026-01-01T10:00:00', updatedAt: '2026-01-01T10:00:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ back: mockBack, push: mockPush });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    eliminarProducto: mockEliminarProducto,
    actualizarCantidad: jest.fn(),
  });
  mockService.filtrarProductos.mockResolvedValue([]);
});

it('renderiza_titulo_correcto_para_filtro_caducado', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caducado' });
  const { getByText } = render(<ListaFiltradaScreen />);
  await waitFor(() => expect(getByText('Productos caducados')).toBeTruthy());
});

it('renderiza_titulo_correcto_para_filtro_caduca_pronto', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caduca_pronto' });
  const { getByText } = render(<ListaFiltradaScreen />);
  await waitFor(() => expect(getByText('Caduca pronto')).toBeTruthy());
});

it('renderiza_titulo_correcto_para_filtro_caduca_semana', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caduca_semana' });
  const { getByText } = render(<ListaFiltradaScreen />);
  await waitFor(() => expect(getByText('Caduca esta semana')).toBeTruthy());
});

it('renderiza_titulo_correcto_para_filtro_caduca_mes', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caduca_mes' });
  const { getByText } = render(<ListaFiltradaScreen />);
  await waitFor(() => expect(getByText('Caduca este mes')).toBeTruthy());
});

it('renderiza_titulo_correcto_para_filtro_bajoStock', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'bajoStock' });
  const { getByText } = render(<ListaFiltradaScreen />);
  await waitFor(() => expect(getByText('Bajo stock')).toBeTruthy());
});

it('muestra_boton_papelera_en_lista_caducados', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caducado' });
  mockService.filtrarProductos.mockResolvedValue([productoBase]);
  const { UNSAFE_getAllByProps } = render(<ListaFiltradaScreen />);
  await waitFor(() =>
    expect(UNSAFE_getAllByProps({ hitSlop: 8 }).length).toBeGreaterThan(0)
  );
});

it('no_muestra_boton_carrito_en_lista_caducados', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caducado' });
  mockService.filtrarProductos.mockResolvedValue([productoBase]);
  const { queryByText } = render(<ListaFiltradaScreen />);
  await waitFor(() => expect(queryByText('Añadir al carrito')).toBeNull());
});

it('muestra_boton_placeholder_carrito_en_caduca_pronto', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caduca_pronto' });
  mockService.filtrarProductos.mockResolvedValue([{ ...productoBase, estado: 'caduca_pronto' as const }]);
  const { findByText } = render(<ListaFiltradaScreen />);
  expect(await findByText('Añadir al carrito')).toBeTruthy();
});

it('muestra_empty_state_positivo_si_lista_vacia', async () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ filtro: 'caducado' });
  mockService.filtrarProductos.mockResolvedValue([]);
  const { findByText } = render(<ListaFiltradaScreen />);
  expect(await findByText('¡Perfecto! No tienes productos caducados')).toBeTruthy();
});
