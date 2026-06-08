import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { MenuPerfil } from '@/components/perfil/MenuPerfil';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

const mockCerrarSesion = jest.fn();
const mockEliminarCuenta = jest.fn();
const mockReset = jest.fn();
const mockLogout = jest.fn();

jest.mock('@/store/perfilStore', () => ({
  usePerfilStore: () => ({
    cerrarSesion: mockCerrarSesion,
    eliminarCuenta: mockEliminarCuenta,
    reset: mockReset,
  }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: { logout: jest.Mock }) => unknown) =>
    selector({ logout: mockLogout }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert');
});

it('renderiza_todas_las_opciones_de_menu', () => {
  const { getByText } = render(<MenuPerfil />);
  expect(getByText('Mis recetas publicadas')).toBeTruthy();
  expect(getByText('Recetas guardadas')).toBeTruthy();
  expect(getByText('Preferencias alimentarias')).toBeTruthy();
  expect(getByText('Privacidad')).toBeTruthy();
  expect(getByText('Estadísticas')).toBeTruthy();
  expect(getByText('Cerrar sesión')).toBeTruthy();
  expect(getByText('Eliminar cuenta')).toBeTruthy();
});

it('navega_a_RecetasPublicadas_al_pulsar', () => {
  const { getByText } = render(<MenuPerfil />);
  fireEvent.press(getByText('Mis recetas publicadas'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/recetas-publicadas');
});

it('navega_a_RecetasGuardadas_al_pulsar', () => {
  const { getByText } = render(<MenuPerfil />);
  fireEvent.press(getByText('Recetas guardadas'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/recetas-guardadas');
});

it('navega_a_Preferencias_al_pulsar', () => {
  const { getByText } = render(<MenuPerfil />);
  fireEvent.press(getByText('Preferencias alimentarias'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/preferencias');
});

it('navega_a_Privacidad_al_pulsar', () => {
  const { getByText } = render(<MenuPerfil />);
  fireEvent.press(getByText('Privacidad'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/privacidad');
});

it('navega_a_Estadisticas_al_pulsar', () => {
  const { getByText } = render(<MenuPerfil />);
  fireEvent.press(getByText('Estadísticas'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/estadisticas');
});

it('muestra_alert_confirmacion_al_pulsar_cerrar_sesion', () => {
  const { getByText } = render(<MenuPerfil />);
  fireEvent.press(getByText('Cerrar sesión'));
  expect(Alert.alert).toHaveBeenCalledWith(
    'Cerrar sesión',
    expect.any(String),
    expect.any(Array)
  );
});

it('muestra_alert_doble_confirmacion_al_pulsar_eliminar_cuenta', () => {
  const { getByText } = render(<MenuPerfil />);
  fireEvent.press(getByText('Eliminar cuenta'));
  expect(Alert.alert).toHaveBeenCalledWith(
    'Eliminar cuenta',
    expect.any(String),
    expect.any(Array)
  );
});
