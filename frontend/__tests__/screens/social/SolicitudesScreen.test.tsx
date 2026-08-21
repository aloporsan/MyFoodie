import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SolicitudesScreen } from '@/screens/social/SolicitudesScreen';
import { Seguimiento, socialService } from '@/services/socialService';
import { useSocialStore } from '@/store/socialStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/socialService');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

const mockSocialService = socialService as jest.Mocked<typeof socialService>;

const solicitudBase: Seguimiento = {
  id: 'seg-1',
  usuarioId: 'user-2',
  nombre: 'Bruno López',
  nombreUsuario: 'brunolopez',
  fotoPerfil: null,
  estado: 'pendiente',
  fechaSeguimiento: '2026-01-15T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  useSocialStore.setState({ solicitudesPendientes: [], isLoading: false, error: null });
  mockSocialService.obtenerSolicitudes.mockResolvedValue([]);
});

it('renderiza_lista_de_solicitudes', async () => {
  mockSocialService.obtenerSolicitudes.mockResolvedValue([solicitudBase]);
  const { findByText } = render(<SolicitudesScreen />);
  expect(await findByText('Bruno López')).toBeTruthy();
});

it('muestra_empty_state_si_no_hay_solicitudes', async () => {
  mockSocialService.obtenerSolicitudes.mockResolvedValue([]);
  const { findByText } = render(<SolicitudesScreen />);
  expect(await findByText('No tienes solicitudes pendientes')).toBeTruthy();
});

it('solicitud_desaparece_tras_aceptar', async () => {
  mockSocialService.obtenerSolicitudes.mockResolvedValue([solicitudBase]);
  mockSocialService.aceptarSolicitud.mockResolvedValue({ ...solicitudBase, estado: 'aceptado' });
  const { findByText, getByTestId, queryByText } = render(<SolicitudesScreen />);
  await findByText('Bruno López');

  await act(async () => {
    fireEvent.press(getByTestId('btn-aceptar'));
  });

  await waitFor(() => expect(queryByText('Bruno López')).toBeNull());
});

it('solicitud_desaparece_tras_rechazar', async () => {
  mockSocialService.obtenerSolicitudes.mockResolvedValue([solicitudBase]);
  mockSocialService.rechazarSolicitud.mockResolvedValue(undefined);
  const { findByText, getByTestId, queryByText } = render(<SolicitudesScreen />);
  await findByText('Bruno López');

  await act(async () => {
    fireEvent.press(getByTestId('btn-rechazar'));
  });

  await waitFor(() => expect(queryByText('Bruno López')).toBeNull());
});
