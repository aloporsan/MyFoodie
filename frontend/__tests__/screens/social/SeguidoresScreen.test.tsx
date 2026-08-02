import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { SeguidoresScreen } from '@/screens/social/SeguidoresScreen';
import { Seguimiento, socialService } from '@/services/socialService';
import { useSocialStore } from '@/store/socialStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/socialService');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

const mockSocialService = socialService as jest.Mocked<typeof socialService>;

const seguidorA: Seguimiento = {
  id: 'seg-1',
  usuarioId: 'user-2',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  fotoPerfil: null,
  estado: 'aceptado',
  fechaSeguimiento: '2026-01-15T00:00:00.000Z',
};

const seguidorB: Seguimiento = {
  id: 'seg-2',
  usuarioId: 'user-3',
  nombre: 'Bruno López',
  nombreUsuario: 'brunolopez',
  fotoPerfil: null,
  estado: 'aceptado',
  fechaSeguimiento: '2026-01-15T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useSocialStore.setState({ seguidores: [], isLoading: false, error: null });
});

afterEach(() => {
  jest.useRealTimers();
});

it('renderiza_lista_correctamente', async () => {
  mockSocialService.obtenerSeguidores.mockResolvedValue([seguidorA, seguidorB]);
  const { findByText } = render(<SeguidoresScreen />);
  expect(await findByText('Ana García')).toBeTruthy();
  expect(await findByText('Bruno López')).toBeTruthy();
});

it('muestra_empty_state_si_vacia', async () => {
  mockSocialService.obtenerSeguidores.mockResolvedValue([]);
  const { findByText } = render(<SeguidoresScreen />);
  expect(await findByText('Aún no tienes seguidores')).toBeTruthy();
});

it('filtro_interno_funciona_correctamente', async () => {
  mockSocialService.obtenerSeguidores.mockResolvedValue([seguidorA, seguidorB]);
  const { findByText, getByTestId, queryByText } = render(<SeguidoresScreen />);
  await findByText('Ana García');

  fireEvent.changeText(getByTestId('input-buscar-usuarios'), 'bruno');
  act(() => {
    jest.advanceTimersByTime(300);
  });

  expect(queryByText('Ana García')).toBeNull();
  expect(await findByText('Bruno López')).toBeTruthy();
});
