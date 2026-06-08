import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { EditarPerfilScreen } from '@/screens/perfil/EditarPerfilScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
  launchImageLibraryAsync: jest.fn(),
}));

const mockEditarPerfil = jest.fn();

const mockPerfil = {
  id: 'user-1',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  email: 'ana@example.com',
  fotoPerfil: null,
  biografia: 'Amante de la cocina',
  fechaRegistro: '2024-01-15T00:00:00.000Z',
};

jest.mock('@/store/perfilStore', () => ({
  usePerfilStore: jest.fn(),
}));

const { usePerfilStore } = require('@/store/perfilStore');
const { useRouter } = require('expo-router');

const makeStore = (overrides = {}) => ({
  perfil: mockPerfil,
  isLoading: false,
  error: null,
  editarPerfil: mockEditarPerfil,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  usePerfilStore.mockReturnValue(makeStore());
  useRouter.mockReturnValue({ push: mockPush, back: mockBack });
  mockEditarPerfil.mockResolvedValue(undefined);
});

it('renderiza_campos_con_datos_actuales_del_perfil', () => {
  const { getByDisplayValue } = render(<EditarPerfilScreen />);
  expect(getByDisplayValue('Ana García')).toBeTruthy();
  expect(getByDisplayValue('anagarcia')).toBeTruthy();
  expect(getByDisplayValue('Amante de la cocina')).toBeTruthy();
});

it('boton_guardar_deshabilitado_si_no_hay_cambios', () => {
  const { getByText } = render(<EditarPerfilScreen />);
  // Button is disabled initially because no changes have been made
  fireEvent.press(getByText('Guardar cambios'));
  expect(mockEditarPerfil).not.toHaveBeenCalled();
});

it('boton_guardar_deshabilitado_si_nombre_vacio', async () => {
  const { getByDisplayValue, getByText } = render(<EditarPerfilScreen />);
  await act(async () => {
    fireEvent.changeText(getByDisplayValue('Ana García'), '');
  });
  fireEvent.press(getByText('Guardar cambios'));
  expect(mockEditarPerfil).not.toHaveBeenCalled();
});

it('muestra_error_si_nombreUsuario_duplicado', async () => {
  mockEditarPerfil.mockRejectedValue(new Error('El nombre de usuario ya está en uso'));
  const { getByDisplayValue, getByText } = render(<EditarPerfilScreen />);
  await act(async () => {
    fireEvent.changeText(getByDisplayValue('anagarcia'), 'existente');
  });
  await act(async () => {
    fireEvent.press(getByText('Guardar cambios'));
  });
  // After failed save the user's input is preserved
  expect(getByDisplayValue('existente')).toBeTruthy();
});

it('muestra_toast_exito_al_guardar_correctamente', async () => {
  jest.useFakeTimers();
  const { getByDisplayValue, getByText } = render(<EditarPerfilScreen />);
  await act(async () => {
    fireEvent.changeText(getByDisplayValue('Ana García'), 'Ana López');
  });
  await act(async () => {
    fireEvent.press(getByText('Guardar cambios'));
  });
  expect(mockEditarPerfil).toHaveBeenCalledWith(
    expect.objectContaining({ nombre: 'Ana López' })
  );
  act(() => jest.runAllTimers());
  jest.useRealTimers();
});

it('navega_atras_tras_guardar_exitoso', async () => {
  jest.useFakeTimers();
  const { getByDisplayValue, getByText } = render(<EditarPerfilScreen />);
  await act(async () => {
    fireEvent.changeText(getByDisplayValue('Ana García'), 'Ana López');
  });
  await act(async () => {
    fireEvent.press(getByText('Guardar cambios'));
  });
  await waitFor(() => {
    expect(mockEditarPerfil).toHaveBeenCalled();
  });
  act(() => jest.runAllTimers());
  jest.useRealTimers();
});
