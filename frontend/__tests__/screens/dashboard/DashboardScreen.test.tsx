import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { useDashboardStore } from '@/store/dashboardStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: (cb: () => void) => cb(),
}));
jest.mock('@/store/dashboardStore', () => ({ useDashboardStore: jest.fn() }));
jest.mock('@/store/authStore', () => ({ useAuthStore: jest.fn(() => ({ nombre: 'Test', nombreUsuario: 'testuser' })) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
// Stub de imágenes para evitar que require('@/assets/...') falle
jest.mock('@/assets/images/logo-myfoodie.png', () => 1, { virtual: true });
jest.mock('@/assets/images/logo-texto.png',    () => 2, { virtual: true });

const mockCargarDashboard = jest.fn();
const mockRefrescar = jest.fn();

const resumen = { totalProductos: 5, proximosCaducar: 1, caducados: 0, bajoStock: 1 };
const estadisticas = { totalRegistrados: 5, consumidos: 0, caducadosHistorico: 0, categoriaLider: 'Lácteos', aprovechamiento: 100 };

const storeBase = {
  resumen,
  alertas: [],
  prioritarios: [],
  estadisticas,
  carritoResumen: { disponible: false, productosRecomendados: 0, sugeridos: [] },
  recetasRecomendadas: { disponible: false },
  isLoading: false,
  error: null,
  cargarDashboard: mockCargarDashboard,
  refrescar: mockRefrescar,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useDashboardStore as unknown as jest.Mock).mockReturnValue(storeBase);
});

it('llama_cargarDashboard_al_montar', async () => {
  render(<DashboardScreen />);
  await waitFor(() => expect(mockCargarDashboard).toHaveBeenCalledTimes(1));
});

it('muestra_ResumenDespensaCard_cuando_hay_datos', () => {
  const { getByText } = render(<DashboardScreen />);
  expect(getByText('Mi despensa')).toBeTruthy();
});

it('muestra_empty_state_si_despensa_vacia', () => {
  (useDashboardStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    resumen: { totalProductos: 0, proximosCaducar: 0, caducados: 0, bajoStock: 0 },
  });
  const { getByText } = render(<DashboardScreen />);
  expect(getByText('Tu despensa está vacía')).toBeTruthy();
});

it('muestra_indicador_de_carga_mientras_carga', () => {
  (useDashboardStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    resumen: null,
    isLoading: true,
  });
  const { getByTestId } = render(<DashboardScreen />);
  expect(getByTestId('loading-screen-logo')).toBeTruthy();
});

it('muestra_error_con_boton_reintentar_si_falla', () => {
  (useDashboardStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    resumen: null,
    error: 'Error de red',
  });
  const { getByText } = render(<DashboardScreen />);
  expect(getByText('No se pudo cargar')).toBeTruthy();
  fireEvent.press(getByText('Reintentar'));
  expect(mockCargarDashboard).toHaveBeenCalled();
});
