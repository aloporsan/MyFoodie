import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn() }));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockRegister = jest.fn();
const mockClearError = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: jest.fn(), back: jest.fn(), replace: jest.fn() });
  (useAuthStore as jest.Mock).mockReturnValue({
    register: mockRegister,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  });
});

function rellenarFormulario(getByPlaceholderText: ReturnType<typeof render>['getByPlaceholderText']) {
  fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Test User');
  fireEvent.changeText(getByPlaceholderText('ej. maria_foodie'), 'testuser');
  fireEvent.changeText(getByPlaceholderText('hola@myfoodie.app'), 'test@test.com');
  fireEvent.changeText(getByPlaceholderText('Mínimo 8 caracteres'), 'password123');
  fireEvent.changeText(getByPlaceholderText('Repite la contraseña'), 'password123');
}

// -------------------------------------------------------------------------
// positivos
// -------------------------------------------------------------------------

it('renderiza_correctamente', () => {
  const { getByText, getByPlaceholderText, getAllByText } = render(<RegisterScreen />);
  expect(getByText('Únete a la comunidad MyFoodie')).toBeTruthy();
  expect(getByPlaceholderText('Tu nombre')).toBeTruthy();
  expect(getByPlaceholderText('ej. maria_foodie')).toBeTruthy();
  expect(getByPlaceholderText('hola@myfoodie.app')).toBeTruthy();
  expect(getAllByText('Crear cuenta').length).toBeGreaterThanOrEqual(1);
});

it('muestra_confirmacion_tras_registro_exitoso', async () => {
  mockRegister.mockResolvedValue(undefined);
  const { getByText, getByPlaceholderText, getAllByText } = render(<RegisterScreen />);
  rellenarFormulario(getByPlaceholderText);
  const botones = getAllByText('Crear cuenta');
  fireEvent.press(botones[botones.length - 1]);
  await waitFor(() => {
    expect(mockRegister).toHaveBeenCalledWith({
      nombre: 'Test User',
      nombreUsuario: 'testuser',
      email: 'test@test.com',
      password: 'password123',
    });
  });
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('muestra_error_si_passwords_no_coinciden', () => {
  const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
  fireEvent.changeText(getByPlaceholderText('Mínimo 8 caracteres'), 'password123');
  fireEvent.changeText(getByPlaceholderText('Repite la contraseña'), 'otrapassword');
  expect(getByText('Las contraseñas no coinciden')).toBeTruthy();
});

it('muestra_error_si_email_invalido', () => {
  const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
  fireEvent.changeText(getByPlaceholderText('hola@myfoodie.app'), 'noesvalido');
  fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Test');
  expect(getByText('Email no válido')).toBeTruthy();
});

it('muestra_error_si_nombre_usuario_demasiado_corto', () => {
  const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
  fireEvent.changeText(getByPlaceholderText('ej. maria_foodie'), 'ab');
  fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Test');
  expect(getByText('Solo letras, números y _ (3-30 caracteres)')).toBeTruthy();
});
