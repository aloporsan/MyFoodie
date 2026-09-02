import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HistorialComprasScreen } from '@/screens/carrito/HistorialComprasScreen';
import { HistorialCompra, historialService } from '@/services/historialService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/services/historialService');
jest.mock('@react-native-community/datetimepicker', () => {
  const ReactNative = require('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      ReactNative.createElement('MockDateTimePicker', props),
  };
});

const mockHistorialService = historialService as jest.Mocked<typeof historialService>;

function compra(overrides: Partial<HistorialCompra> = {}): HistorialCompra {
  return {
    id: 'lista-1',
    origen: 'lista',
    titulo: 'Compra semanal',
    fecha: '2025-03-15',
    numeroItems: 3,
    items: ['Leche', 'Huevos', 'Pan'],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHistorialService.obtenerHistorialCompras.mockResolvedValue([compra()]);
});

it('carga_el_historial_sin_filtro_al_entrar', async () => {
  const { findByText } = render(<HistorialComprasScreen />);
  expect(await findByText('Compra semanal')).toBeTruthy();
  expect(mockHistorialService.obtenerHistorialCompras).toHaveBeenCalledWith({
    fechaDesde: '',
    fechaHasta: '',
  });
});

it('filtra_al_seleccionar_rango_de_fechas', async () => {
  const { findByText, getByText, UNSAFE_getByType } = render(<HistorialComprasScreen />);
  await findByText('Compra semanal');

  // Abre el selector "Desde" y elige una fecha
  await act(async () => {
    fireEvent.press(getByText('Desde'));
  });
  await act(async () => {
    UNSAFE_getByType(DateTimePicker).props.onChange({}, new Date('2025-03-01T12:00:00Z'));
  });

  await waitFor(() => {
    expect(mockHistorialService.obtenerHistorialCompras).toHaveBeenLastCalledWith({
      fechaDesde: '2025-03-01',
      fechaHasta: '',
    });
  });
});

it('muestra_estado_vacio_con_rango_sin_resultados', async () => {
  mockHistorialService.obtenerHistorialCompras.mockResolvedValue([]);
  const { findByText } = render(<HistorialComprasScreen />);
  expect(await findByText('Aún no tienes compras registradas')).toBeTruthy();
});

it('distingue_listas_de_tickets_ocr', async () => {
  mockHistorialService.obtenerHistorialCompras.mockResolvedValue([
    compra({ id: 'l1', origen: 'lista', titulo: 'Compra semanal' }),
    compra({ id: 't1', origen: 'ticket', titulo: 'Ticket 2025-03-10' }),
  ]);
  const { findByText, getByText } = render(<HistorialComprasScreen />);
  await findByText('Compra semanal');
  expect(getByText('Lista')).toBeTruthy();
  expect(getByText('Ticket')).toBeTruthy();
});
