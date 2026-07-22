import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { PrivacidadScreen } from '@/screens/perfil/PrivacidadScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockActualizarPrivacidad = jest.fn();

jest.mock('@/store/perfilStore', () => ({
  usePerfilStore: jest.fn(),
}));

const { usePerfilStore } = require('@/store/perfilStore');

beforeEach(() => {
  jest.clearAllMocks();
  usePerfilStore.mockReturnValue({
    actualizarPrivacidad: mockActualizarPrivacidad,
  });
  mockActualizarPrivacidad.mockResolvedValue(undefined);
});

it('renderiza_todos_los_toggles_correctamente', () => {
  const { getByText } = render(<PrivacidadScreen />);
  expect(getByText('Perfil público')).toBeTruthy();
  expect(getByText('Mostrar recetas')).toBeTruthy();
  expect(getByText('Mostrar estadísticas')).toBeTruthy();
  expect(getByText('Permitir mensajes')).toBeTruthy();
});

it('toggle_guarda_automaticamente_al_cambiar', async () => {
  const { getAllByRole } = render(<PrivacidadScreen />);
  const switches = getAllByRole('switch');
  await act(async () => {
    fireEvent(switches[0], 'valueChange', false);
  });
  await waitFor(() => {
    expect(mockActualizarPrivacidad).toHaveBeenCalledWith({ perfilPublico: false });
  });
});

it('renderiza_descripcion_bajo_cada_toggle', () => {
  const { getByText } = render(<PrivacidadScreen />);
  expect(getByText('Cualquier usuario puede ver tu perfil')).toBeTruthy();
  expect(getByText('Tus recetas publicadas son visibles para otros')).toBeTruthy();
  expect(getByText('Otros usuarios pueden ver tus estadísticas')).toBeTruthy();
  expect(getByText('Otros usuarios pueden enviarte mensajes')).toBeTruthy();
});
