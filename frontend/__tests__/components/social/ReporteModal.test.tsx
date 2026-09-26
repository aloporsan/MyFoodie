import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ReporteModal } from '@/components/social/ReporteModal';
import { reporteService } from '@/services/reporteService';
import { useToastStore } from '@/hooks/useToast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/services/reporteService', () => ({
  ...jest.requireActual('@/services/reporteService'),
  reporteService: { crearReporte: jest.fn() },
}));

const mockCrearReporte = reporteService.crearReporte as jest.Mock;
const onClose = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
});

it('muestra_campo_otro_motivo_solo_si_motivo_es_otro', () => {
  const { getByTestId, queryByTestId } = render(
    <ReporteModal visible tipoContenido="RECETA" contenidoId="receta-1" onClose={onClose} />
  );

  expect(queryByTestId('input-descripcion-reporte')).toBeNull();

  fireEvent.press(getByTestId('motivo-OTRO'));
  expect(getByTestId('input-descripcion-reporte')).toBeTruthy();

  fireEvent.press(getByTestId('motivo-SPAM'));
  expect(queryByTestId('input-descripcion-reporte')).toBeNull();
});

it('envia_tipoContenido_y_contenidoId_correctos', async () => {
  mockCrearReporte.mockResolvedValue({});
  const { getByTestId, getByText } = render(
    <ReporteModal visible tipoContenido="COMENTARIO" contenidoId="com-9" onClose={onClose} />
  );

  fireEvent.press(getByTestId('motivo-SPAM'));
  fireEvent.press(getByText('Enviar reporte'));

  await waitFor(() => {
    expect(mockCrearReporte).toHaveBeenCalledWith({
      tipoContenido: 'COMENTARIO',
      contenidoId: 'com-9',
      motivo: 'SPAM',
      descripcionAdicional: undefined,
    });
    expect(onClose).toHaveBeenCalled();
  });
});

it('no_permite_enviar_sin_motivo', () => {
  const { getByText } = render(
    <ReporteModal visible tipoContenido="PERFIL" contenidoId="user-1" onClose={onClose} />
  );

  fireEvent.press(getByText('Enviar reporte'));

  expect(mockCrearReporte).not.toHaveBeenCalled();
});
