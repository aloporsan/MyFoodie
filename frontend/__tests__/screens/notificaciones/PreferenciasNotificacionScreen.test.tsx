import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { PreferenciasNotificacionScreen } from '@/screens/notificaciones/PreferenciasNotificacionScreen';
import { notificacionService } from '@/services/notificacionService';
import { useNotificacionStore } from '@/store/notificacionStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), patch: jest.fn() },
  setTokenGetter: jest.fn(),
}));
jest.mock('@/services/notificacionService');

const mockService = notificacionService as jest.Mocked<typeof notificacionService>;

const mockPreferencias = {
  notificarNuevoSeguidor: true,
  notificarSolicitudSeguimiento: true,
  notificarLikes: true,
  notificarComentarios: false,
  notificarRecetasCompartidas: true,
  notificarCaducidades: true,
  notificarCarrito: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  useNotificacionStore.setState({
    notificaciones: [],
    pagina: 0,
    hayMas: false,
    contadorNoLeidas: 0,
    preferenciasNotificacion: null,
    isLoading: false,
    isLoadingMas: false,
    error: null,
  });
  mockService.obtenerPreferencias.mockResolvedValue(mockPreferencias);
});

it('renderiza_todas_las_opciones_tras_cargar_las_preferencias', async () => {
  const { getByText } = render(<PreferenciasNotificacionScreen />);

  await waitFor(() => expect(getByText('Nuevos seguidores')).toBeTruthy());
  expect(getByText('Solicitudes de seguimiento')).toBeTruthy();
  expect(getByText('Likes en mis recetas')).toBeTruthy();
  expect(getByText('Comentarios en mis recetas')).toBeTruthy();
  expect(getByText('Recetas compartidas conmigo')).toBeTruthy();
  expect(getByText('Alertas de caducidad')).toBeTruthy();
  expect(getByText('Actualizaciones del carrito')).toBeTruthy();
});

it('refleja_el_valor_desactivado_de_una_preferencia', async () => {
  const { getByText, getAllByRole } = render(<PreferenciasNotificacionScreen />);
  await waitFor(() => expect(getByText('Comentarios en mis recetas')).toBeTruthy());

  const switches = getAllByRole('switch');
  expect(switches[3].props.value).toBe(false); // notificarComentarios
});

it('cambiar_un_toggle_guarda_automaticamente_el_campo_correspondiente', async () => {
  mockService.actualizarPreferencias.mockResolvedValue({ ...mockPreferencias, notificarLikes: false });
  const { getByText, getAllByRole } = render(<PreferenciasNotificacionScreen />);
  await waitFor(() => expect(getByText('Likes en mis recetas')).toBeTruthy());

  const switches = getAllByRole('switch');
  await act(async () => {
    fireEvent(switches[2], 'valueChange', false); // notificarLikes
  });

  await waitFor(() => {
    expect(mockService.actualizarPreferencias).toHaveBeenCalledWith({ notificarLikes: false });
  });
});

it('revierte_el_toggle_si_falla_el_guardado', async () => {
  mockService.actualizarPreferencias.mockRejectedValue(new Error('Error de red'));
  const { getByText, getAllByRole } = render(<PreferenciasNotificacionScreen />);
  await waitFor(() => expect(getByText('Likes en mis recetas')).toBeTruthy());

  const switches = getAllByRole('switch');
  await act(async () => {
    fireEvent(switches[2], 'valueChange', false);
  });

  await waitFor(() => expect(switches[2].props.value).toBe(true));
});
