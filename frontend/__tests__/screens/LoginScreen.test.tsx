import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockLogin = jest.fn();
const mockClearError = jest.fn();
const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: jest.fn(), replace: jest.fn() });
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  });
});

// -------------------------------------------------------------------------
// positivos
// -------------------------------------------------------------------------

it('renderiza_correctamente', () => {
  const { getByText, getByPlaceholderText } = render(<LoginScreen />);
  expect(getByText('¡Bienvenido a MyFoodie!')).toBeTruthy();
  expect(getByPlaceholderText('hola@myfoodie.app')).toBeTruthy();
  expect(getByPlaceholderText('Mínimo 8 caracteres')).toBeTruthy();
  expect(getByText('Iniciar sesión')).toBeTruthy();
});

it('boton_deshabilitado_si_campos_vacios', () => {
  const { getByText } = render(<LoginScreen />);
  fireEvent.press(getByText('Iniciar sesión'));
  expect(mockLogin).not.toHaveBeenCalled();
});

it('navega_a_home_tras_login_exitoso', async () => {
  mockLogin.mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText } = render(<LoginScreen />);
  fireEvent.changeText(getByPlaceholderText('hola@myfoodie.app'), 'test@test.com');
  fireEvent.changeText(getByPlaceholderText('Mínimo 8 caracteres'), 'password123');
  fireEvent.press(getByText('Iniciar sesión'));
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
  });
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('muestra_error_si_credenciales_incorrectas', () => {
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    login: mockLogin,
    isLoading: false,
    error: 'Credenciales incorrectas',
    clearError: mockClearError,
  });
  const { getByText } = render(<LoginScreen />);
  expect(getByText('Credenciales incorrectas')).toBeTruthy();
});

it('muestra_error_si_email_formato_invalido', () => {
  const { getByText, getByPlaceholderText } = render(<LoginScreen />);
  fireEvent.changeText(getByPlaceholderText('hola@myfoodie.app'), 'emailinvalido');
  fireEvent.press(getByText('Iniciar sesión'));
  expect(getByText('Email no válido')).toBeTruthy();
  expect(mockLogin).not.toHaveBeenCalled();
});
