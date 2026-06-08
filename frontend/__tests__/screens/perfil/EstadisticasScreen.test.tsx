import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { EstadisticasScreen } from '@/screens/perfil/EstadisticasScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

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
  totalProductosRegistrados: 42,
  totalProductosConsumidos: 30,
  totalProductosCaducados: 5,
  totalRecetasPublicadas: 8,
  totalRecetasGuardadas: 15,
  fechaRegistro: '2024-01-15T00:00:00.000Z',
};

jest.mock('@/store/perfilStore', () => ({
  usePerfilStore: jest.fn(),
}));

const { usePerfilStore } = require('@/store/perfilStore');

const makeStore = (overrides = {}) => ({
  perfil: mockPerfil,
  estadisticas: mockEstadisticas,
  isLoading: false,
  error: null,
  cargarEstadisticas: mockCargarEstadisticas,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  usePerfilStore.mockReturnValue(makeStore());
  mockCargarEstadisticas.mockResolvedValue(undefined);
});

it('renderiza_secciones_despensa_recetas_actividad', async () => {
  const { getByText } = render(<EstadisticasScreen />);
  await act(async () => {});
  expect(getByText('Despensa')).toBeTruthy();
  expect(getByText('Recetas')).toBeTruthy();
  expect(getByText('Actividad')).toBeTruthy();
});

it('renderiza_contadores_correctamente', async () => {
  const { getByText } = render(<EstadisticasScreen />);
  await act(async () => {});
  expect(getByText('42')).toBeTruthy();
  expect(getByText('30')).toBeTruthy();
  expect(getByText('8')).toBeTruthy();
  expect(getByText('15')).toBeTruthy();
});

it('muestra_indicador_carga_mientras_carga', () => {
  usePerfilStore.mockReturnValue({
    ...makeStore({ estadisticas: null, isLoading: true }),
  });
  const { UNSAFE_getByType } = render(<EstadisticasScreen />);
  expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
});
