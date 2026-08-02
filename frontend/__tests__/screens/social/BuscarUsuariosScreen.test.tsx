import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { BuscarUsuariosScreen } from '@/screens/social/BuscarUsuariosScreen';
import { UsuarioBusqueda, socialService } from '@/services/socialService';
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

const usuarioBase: UsuarioBusqueda = {
  id: 'user-2',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  fotoPerfil: null,
  numRecetas: 4,
  esSeguido: false,
  haSolicitado: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useSocialStore.setState({ resultadosBusqueda: [], isLoading: false, error: null });
});

afterEach(() => {
  jest.useRealTimers();
});

it('renderiza_buscador_correctamente', () => {
  const { getByTestId, getByText } = render(<BuscarUsuariosScreen />);
  expect(getByTestId('input-buscar-usuarios')).toBeTruthy();
  expect(getByText('Encuentra a otros cocineros')).toBeTruthy();
});

it('muestra_resultados_al_buscar', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuarioBase]);
  const { getByTestId, findByText } = render(<BuscarUsuariosScreen />);

  fireEvent.changeText(getByTestId('input-buscar-usuarios'), 'ana');
  act(() => {
    jest.advanceTimersByTime(300);
  });

  expect(await findByText('Ana García')).toBeTruthy();
});

it('muestra_empty_state_si_sin_resultados', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([]);
  const { getByTestId, findByText } = render(<BuscarUsuariosScreen />);

  fireEvent.changeText(getByTestId('input-buscar-usuarios'), 'xyz');
  act(() => {
    jest.advanceTimersByTime(300);
  });

  expect(await findByText('Sin resultados')).toBeTruthy();
});
