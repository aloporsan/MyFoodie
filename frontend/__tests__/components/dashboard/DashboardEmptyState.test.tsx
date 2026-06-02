import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { useRouter } from 'expo-router';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

it('renderiza_mensaje_de_despensa_vacia', () => {
  const { getByText } = render(<DashboardEmptyState />);
  expect(getByText('Tu despensa está vacía')).toBeTruthy();
});

it('renderiza_boton_anadir_primer_producto', () => {
  const { getByText } = render(<DashboardEmptyState />);
  expect(getByText('Añadir primer producto')).toBeTruthy();
});

it('navega_a_FormProducto_al_pulsar_boton', () => {
  const { getByText } = render(<DashboardEmptyState />);
  fireEvent.press(getByText('Añadir primer producto'));
  expect(mockPush).toHaveBeenCalledWith('/despensa/form');
});
