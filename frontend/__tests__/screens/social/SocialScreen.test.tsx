import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SocialScreen } from '@/screens/social/SocialScreen';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const mockState: any = {
  solicitudesPendientes: [],
  contadorCompartir: 0,
  contadorNotificaciones: 0,
};
const mockCargarSolicitudes = jest.fn();
const mockCargarContadorCompartir = jest.fn();
const mockCargarContadorNotificaciones = jest.fn();

jest.mock('@/store/socialStore', () => ({
  useSocialStore: (selector: any) =>
    selector({ solicitudesPendientes: mockState.solicitudesPendientes, cargarSolicitudes: mockCargarSolicitudes }),
}));
jest.mock('@/store/compartirStore', () => ({
  useCompartirStore: (selector: any) =>
    selector({ contadorNoLeidas: mockState.contadorCompartir, cargarContador: mockCargarContadorCompartir }),
}));
jest.mock('@/store/notificacionStore', () => ({
  useNotificacionStore: (selector: any) =>
    selector({ contadorNoLeidas: mockState.contadorNotificaciones, cargarContador: mockCargarContadorNotificaciones }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockState.solicitudesPendientes = [];
  mockState.contadorCompartir = 0;
  mockState.contadorNotificaciones = 0;
});

it('renderiza_todas_las_opciones_del_menu', () => {
  const { getByText } = render(<SocialScreen />);
  expect(getByText('Notificaciones')).toBeTruthy();
  expect(getByText('Solicitudes de seguimiento')).toBeTruthy();
  expect(getByText('Recetas recibidas')).toBeTruthy();
  expect(getByText('Buscar usuarios')).toBeTruthy();
  expect(getByText('Usuarios bloqueados')).toBeTruthy();
});

it('carga_los_tres_contadores_al_montar', () => {
  render(<SocialScreen />);
  expect(mockCargarSolicitudes).toHaveBeenCalled();
  expect(mockCargarContadorCompartir).toHaveBeenCalled();
  expect(mockCargarContadorNotificaciones).toHaveBeenCalled();
});

it('pulsar_Notificaciones_navega_a_la_pantalla_de_notificaciones', () => {
  const { getByText } = render(<SocialScreen />);
  fireEvent.press(getByText('Notificaciones'));
  expect(mockPush).toHaveBeenCalledWith('/notificaciones');
});

it('muestra_el_badge_de_notificaciones_con_el_contador_del_store', () => {
  mockState.contadorNotificaciones = 11;
  const { getByTestId } = render(<SocialScreen />);
  expect(getByTestId('badge-Notificaciones')).toBeTruthy();
});

it('no_muestra_el_badge_de_notificaciones_si_el_contador_es_cero', () => {
  mockState.contadorNotificaciones = 0;
  const { queryByTestId } = render(<SocialScreen />);
  expect(queryByTestId('badge-Notificaciones')).toBeNull();
});

it('muestra_el_badge_de_solicitudes_pendientes', () => {
  mockState.solicitudesPendientes = [{ id: 's1' }, { id: 's2' }];
  const { getByTestId } = render(<SocialScreen />);
  expect(getByTestId('badge-Solicitudes de seguimiento')).toBeTruthy();
});
