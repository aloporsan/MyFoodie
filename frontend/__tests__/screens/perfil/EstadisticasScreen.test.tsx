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

// -------------------------------------------------------------------------
// MEJORA 3 — Motivos de eliminación y eficiencia (#014/#015)
// -------------------------------------------------------------------------

const mockMotivos = {
  consumido: 20,
  caducado: 4,
  usado_en_receta: 6,
  donado: 2,
  perdido: 1,
  otro: 3,
};

const mockEstadisticasConMotivos = {
  ...mockEstadisticas,
  motivosEliminacion: mockMotivos,
};

it('renderiza_seccion_motivos_de_eliminacion_con_los_6_contadores', async () => {
  usePerfilStore.mockReturnValue(makeStore({ estadisticas: mockEstadisticasConMotivos }));
  const { getByText } = render(<EstadisticasScreen />);
  await act(async () => {});
  expect(getByText('Motivos de eliminación')).toBeTruthy();
  expect(getByText('Consumido')).toBeTruthy();
  expect(getByText('Caducado')).toBeTruthy();
  expect(getByText('En receta')).toBeTruthy();
  expect(getByText('Donado')).toBeTruthy();
  expect(getByText('Perdido')).toBeTruthy();
  expect(getByText('Otro')).toBeTruthy();
  expect(getByText('20')).toBeTruthy();
  expect(getByText('6')).toBeTruthy();
});

it('calcula_la_eficiencia_a_partir_de_los_motivos_reales', async () => {
  // bienUsados = 20+6+2 = 28, desperdiciados = 4+1 = 5, total = 33 -> 28/33 = 85%
  usePerfilStore.mockReturnValue(makeStore({ estadisticas: mockEstadisticasConMotivos }));
  const { getByText } = render(<EstadisticasScreen />);
  await act(async () => {});
  expect(getByText('85%')).toBeTruthy();
  expect(getByText('28 bien usados · 5 desperdiciados')).toBeTruthy();
});

it('no_renderiza_seccion_de_motivos_si_no_vienen_en_las_estadisticas', async () => {
  usePerfilStore.mockReturnValue(makeStore({ estadisticas: mockEstadisticas }));
  const { queryByText } = render(<EstadisticasScreen />);
  await act(async () => {});
  expect(queryByText('Motivos de eliminación')).toBeNull();
});

it('eficiencia_es_guion_cuando_no_hay_movimientos_registrados', async () => {
  const sinMovimientos = {
    ...mockEstadisticas,
    motivosEliminacion: { consumido: 0, caducado: 0, usado_en_receta: 0, donado: 0, perdido: 0, otro: 0 },
  };
  usePerfilStore.mockReturnValue(makeStore({ estadisticas: sinMovimientos }));
  const { getByText } = render(<EstadisticasScreen />);
  await act(async () => {});
  expect(getByText('--')).toBeTruthy();
});
