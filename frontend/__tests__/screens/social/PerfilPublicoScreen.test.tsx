import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PerfilPublicoScreen } from '@/screens/social/PerfilPublicoScreen';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';
import { PerfilPublico, socialService } from '@/services/socialService';
import { useSocialStore } from '@/store/socialStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/services/socialService');

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, canGoBack: mockCanGoBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'user-2' }),
}));

const mockSocialService = socialService as jest.Mocked<typeof socialService>;

const perfilPublicoBase: PerfilPublico = {
  id: 'user-2',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  fotoPerfil: null,
  biografia: 'Amante de la cocina',
  numSeguidores: 10,
  numSeguidos: 5,
  numRecetas: 3,
  esSeguido: false,
  haSolicitado: false,
  estaBloqueado: false,
  privacidad: 'PUBLICA',
};

function renderPantalla() {
  return render(
    <>
      <PerfilPublicoScreen />
      <ConfirmModal />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useSocialStore.setState({
    perfilPublico: null,
    isLoading: false,
    error: null,
  });
  useConfirmStore.setState({
    visible: false,
    title: '',
    message: undefined,
    icon: undefined,
    variant: 'default',
    buttons: [],
  });
});

it('renderiza_datos_publicos_del_perfil', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue(perfilPublicoBase);
  const { getByText, getAllByText } = renderPantalla();
  await waitFor(() => {
    expect(getByText('Ana García')).toBeTruthy();
    expect(getAllByText('@anagarcia').length).toBeGreaterThan(0);
  });
});

it('muestra_boton_seguir_si_no_sigue', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue(perfilPublicoBase);
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Seguir')).toBeTruthy());
});

it('muestra_boton_solicitar_si_perfil_privado', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue({
    ...perfilPublicoBase,
    privacidad: 'PRIVADA',
  });
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Solicitar seguimiento')).toBeTruthy());
});

it('muestra_mensaje_privado_si_no_es_seguidor', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue({
    ...perfilPublicoBase,
    privacidad: 'PRIVADA',
    esSeguido: false,
  });
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Este perfil es privado')).toBeTruthy());
});

it('muestra_grid_recetas_si_perfil_publico', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue(perfilPublicoBase);
  const { getByText, queryByText } = renderPantalla();
  await waitFor(() =>
    expect(getByText('El listado de recetas publicadas estará disponible próximamente')).toBeTruthy()
  );
  expect(queryByText('Este perfil es privado')).toBeNull();
});

it('menu_opciones_incluye_bloquear_y_reportar', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue(perfilPublicoBase);
  const { getByText, getByTestId } = renderPantalla();
  await waitFor(() => expect(getByText('Ana García')).toBeTruthy());

  fireEvent.press(getByTestId('btn-opciones'));

  expect(getByText('Reportar perfil')).toBeTruthy();
  expect(getByText('Bloquear usuario')).toBeTruthy();
});
