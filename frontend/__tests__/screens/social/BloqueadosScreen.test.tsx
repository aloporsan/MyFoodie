import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { BloqueadosScreen } from '@/screens/social/BloqueadosScreen';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';
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

const bloqueadoBase: UsuarioBusqueda = {
  id: 'user-2',
  nombre: 'Ana García',
  nombreUsuario: 'anagarcia',
  fotoPerfil: null,
  numRecetas: 4,
  esSeguido: false,
  haSolicitado: false,
};

function renderPantalla() {
  return render(
    <>
      <BloqueadosScreen />
      <ConfirmModal />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  useSocialStore.setState({ bloqueados: [], isLoading: false, error: null });
  useConfirmStore.setState({
    visible: false,
    title: '',
    message: undefined,
    icon: undefined,
    variant: 'default',
    buttons: [],
  });
});

it('renderiza_lista_de_bloqueados', async () => {
  mockSocialService.obtenerBloqueados.mockResolvedValue([bloqueadoBase]);
  const { findByText } = renderPantalla();
  expect(await findByText('Ana García')).toBeTruthy();
});

it('muestra_empty_state_si_no_hay_bloqueados', async () => {
  mockSocialService.obtenerBloqueados.mockResolvedValue([]);
  const { findByText } = renderPantalla();
  expect(await findByText('No has bloqueado a ningún usuario')).toBeTruthy();
});

it('llama_desbloquear_al_pulsar_opcion', async () => {
  mockSocialService.obtenerBloqueados.mockResolvedValue([bloqueadoBase]);
  mockSocialService.desbloquearUsuario.mockResolvedValue(undefined);
  const { findByText, getByTestId, getByText } = renderPantalla();
  await findByText('Ana García');

  fireEvent.press(getByTestId('btn-desbloquear'));
  expect(getByText('¿Quieres desbloquear a @anagarcia?')).toBeTruthy();

  await act(async () => {
    fireEvent.press(getByTestId('confirm-modal-btn-1'));
  });

  expect(mockSocialService.desbloquearUsuario).toHaveBeenCalledWith('user-2');
});
