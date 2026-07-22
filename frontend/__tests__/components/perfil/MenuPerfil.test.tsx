import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { MenuPerfil } from '@/components/perfil/MenuPerfil';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';

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
  useConfirmStore.setState({
    visible: false,
    title: '',
    message: undefined,
    icon: undefined,
    variant: 'default',
    buttons: [],
  });
});

function renderMenu() {
  return render(
    <>
      <MenuPerfil />
      <ConfirmModal />
    </>
  );
}

it('renderiza_todas_las_opciones_de_menu', () => {
  const { getByText } = renderMenu();
  expect(getByText('Mis recetas publicadas')).toBeTruthy();
  expect(getByText('Recetas guardadas')).toBeTruthy();
  expect(getByText('Preferencias alimentarias')).toBeTruthy();
  expect(getByText('Privacidad')).toBeTruthy();
  expect(getByText('Estadísticas')).toBeTruthy();
  expect(getByText('Cerrar sesión')).toBeTruthy();
  expect(getByText('Eliminar cuenta')).toBeTruthy();
});

it('navega_a_RecetasPublicadas_al_pulsar', () => {
  const { getByText } = renderMenu();
  fireEvent.press(getByText('Mis recetas publicadas'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/recetas-publicadas');
});

it('navega_a_RecetasGuardadas_al_pulsar', () => {
  const { getByText } = renderMenu();
  fireEvent.press(getByText('Recetas guardadas'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/recetas-guardadas');
});

it('navega_a_Preferencias_al_pulsar', () => {
  const { getByText } = renderMenu();
  fireEvent.press(getByText('Preferencias alimentarias'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/preferencias');
});

it('navega_a_Privacidad_al_pulsar', () => {
  const { getByText } = renderMenu();
  fireEvent.press(getByText('Privacidad'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/privacidad');
});

it('navega_a_Estadisticas_al_pulsar', () => {
  const { getByText } = renderMenu();
  fireEvent.press(getByText('Estadísticas'));
  expect(mockPush).toHaveBeenCalledWith('/perfil/estadisticas');
});

it('muestra_modal_confirmacion_al_pulsar_cerrar_sesion', () => {
  const { getByText } = renderMenu();
  fireEvent.press(getByText('Cerrar sesión'));
  expect(getByText('¿Seguro que quieres cerrar sesión?')).toBeTruthy();
});

it('cierra_sesion_tras_confirmar_en_el_modal', async () => {
  const { getByText, getByTestId } = renderMenu();
  fireEvent.press(getByText('Cerrar sesión'));
  await act(async () => {
    fireEvent.press(getByTestId('confirm-modal-btn-1'));
  });
  await waitFor(() => {
    expect(mockCerrarSesion).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
  });
});

it('muestra_modal_doble_confirmacion_al_pulsar_eliminar_cuenta', async () => {
  const { getByText, getByTestId } = renderMenu();
  fireEvent.press(getByText('Eliminar cuenta'));
  expect(getByText(/Esta acción es irreversible/)).toBeTruthy();

  fireEvent.press(getByTestId('confirm-modal-btn-1'));
  expect(getByText('¿Estás completamente seguro?')).toBeTruthy();
});

it('elimina_cuenta_tras_doble_confirmacion', async () => {
  const { getByText, getByTestId } = renderMenu();
  fireEvent.press(getByText('Eliminar cuenta'));
  fireEvent.press(getByTestId('confirm-modal-btn-1'));

  await act(async () => {
    fireEvent.press(getByTestId('confirm-modal-btn-1'));
  });

  await waitFor(() => {
    expect(mockEliminarCuenta).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
  });
});
