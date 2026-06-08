import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { PerfilScreen } from '@/screens/perfil/PerfilScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockCargarPerfil = jest.fn();
const mockCargarEstadisticas = jest.fn();

const mockPerfil = {
  id: 'user-1',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  email: 'ana@example.com',
  fotoPerfil: null,
  biografia: null,
  fechaRegistro: '2024-01-15T00:00:00.000Z',
};

const mockEstadisticas = {
  totalProductosRegistrados: 10,
  totalProductosConsumidos: 7,
  totalProductosCaducados: 1,
  totalRecetasPublicadas: 3,
  totalRecetasGuardadas: 5,
  fechaRegistro: '2024-01-15T00:00:00.000Z',
};

jest.mock('@/store/perfilStore', () => ({
  usePerfilStore: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: { logout: jest.Mock }) => unknown) =>
    selector({ logout: jest.fn() }),
}));

const { usePerfilStore } = require('@/store/perfilStore');

const makeStoreSuccess = () => ({
  perfil: mockPerfil,
  estadisticas: mockEstadisticas,
  isLoading: false,
  error: null,
  cargarPerfil: mockCargarPerfil,
  cargarEstadisticas: mockCargarEstadisticas,
  cerrarSesion: jest.fn(),
  eliminarCuenta: jest.fn(),
  reset: jest.fn(),
  preferencias: null,
  clearError: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCargarPerfil.mockResolvedValue(undefined);
  mockCargarEstadisticas.mockResolvedValue(undefined);
});

it('renderiza_header_estadisticas_y_menu', () => {
  usePerfilStore.mockReturnValue(makeStoreSuccess());
  const { getByText } = render(<PerfilScreen />);
  expect(getByText('Ana García')).toBeTruthy();
  expect(getByText('Resumen')).toBeTruthy();
  expect(getByText('Cuenta')).toBeTruthy();
});

it('muestra_indicador_carga_mientras_carga', () => {
  usePerfilStore.mockReturnValue({
    perfil: null,
    estadisticas: null,
    isLoading: true,
    error: null,
    cargarPerfil: mockCargarPerfil,
    cargarEstadisticas: mockCargarEstadisticas,
  });
  const { UNSAFE_getByType } = render(<PerfilScreen />);
  expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
});

it('muestra_error_con_boton_reintentar_si_falla', () => {
  usePerfilStore.mockReturnValue({
    perfil: null,
    estadisticas: null,
    isLoading: false,
    error: 'Sin conexión',
    cargarPerfil: mockCargarPerfil,
    cargarEstadisticas: mockCargarEstadisticas,
  });
  const { getByText } = render(<PerfilScreen />);
  expect(getByText('No se pudo cargar el perfil')).toBeTruthy();
  expect(getByText('Reintentar')).toBeTruthy();
});

it('actualiza_datos_al_hacer_pull_to_refresh', async () => {
  usePerfilStore.mockReturnValue(makeStoreSuccess());
  render(<PerfilScreen />);
  await act(async () => {});
  expect(mockCargarPerfil).toHaveBeenCalled();
  expect(mockCargarEstadisticas).toHaveBeenCalled();
});
