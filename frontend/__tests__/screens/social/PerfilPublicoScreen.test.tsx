import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { PerfilPublicoScreen } from '@/screens/social/PerfilPublicoScreen';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';
import { PerfilPublico, socialService } from '@/services/socialService';
import { Receta, recetaService } from '@/services/recetaService';
import { useSocialStore } from '@/store/socialStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('@/utils/media', () => ({ resolveImagenUrl: (u: string | null) => u ?? null }));
jest.mock('@/services/socialService');
jest.mock('@/services/recetaService');

const mockRecetaService = recetaService as jest.Mocked<typeof recetaService>;

function recetaPublicada(id: string, titulo: string): Receta {
  return {
    id,
    autorId: 'user-2',
    titulo,
    descripcion: 'desc',
    tiempoEstimado: 20,
    dificultad: 'Fácil',
    categoria: 'plato',
    numPersonas: 2,
    etiquetas: [],
    estado: 'publicada',
    ingredientes: [],
    pasos: [],
    totalLikes: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

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
  mockRecetaService.recetasDeUsuario.mockResolvedValue([]);
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

it('muestra_recetas_del_usuario_si_perfil_publico', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue(perfilPublicoBase);
  mockRecetaService.recetasDeUsuario.mockResolvedValue([
    recetaPublicada('r-1', 'Paella de marisco'),
    recetaPublicada('r-2', 'Gazpacho andaluz'),
  ]);
  const { getByText, queryByText } = renderPantalla();
  await waitFor(() => expect(getByText('Paella de marisco')).toBeTruthy());
  expect(getByText('Gazpacho andaluz')).toBeTruthy();
  expect(mockRecetaService.recetasDeUsuario).toHaveBeenCalledWith('user-2');
  expect(queryByText('Este perfil es privado')).toBeNull();
});

it('muestra_mensaje_si_el_usuario_no_tiene_recetas', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue(perfilPublicoBase);
  mockRecetaService.recetasDeUsuario.mockResolvedValue([]);
  const { getByText } = renderPantalla();
  await waitFor(() => expect(getByText('Ana García aún no ha publicado recetas')).toBeTruthy());
});

it('boton_ver_todas_navega_al_listado_completo_cuando_hay_mas_de_3', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue({ ...perfilPublicoBase, numRecetas: 5 });
  mockRecetaService.recetasDeUsuario.mockResolvedValue([
    recetaPublicada('r-1', 'Receta 1'),
    recetaPublicada('r-2', 'Receta 2'),
    recetaPublicada('r-3', 'Receta 3'),
    recetaPublicada('r-4', 'Receta 4'),
    recetaPublicada('r-5', 'Receta 5'),
  ]);
  const { getByText, queryByText } = renderPantalla();
  await waitFor(() => expect(getByText('Ver las 5 recetas')).toBeTruthy());

  // Solo se muestran 3 en la vista previa
  expect(queryByText('Receta 4')).toBeNull();

  fireEvent.press(getByText('Ver las 5 recetas'));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/social/perfil/[id]/recetas',
    params: { id: 'user-2', nombre: 'Ana García' },
  });
});

it('menu_opciones_incluye_bloquear_y_reportar', async () => {
  mockSocialService.obtenerPerfilPublico.mockResolvedValue(perfilPublicoBase);
  const { getByText, getByTestId } = renderPantalla();
  await waitFor(() => expect(getByText('Ana García')).toBeTruthy());

  fireEvent.press(getByTestId('btn-opciones'));

  expect(getByText('Reportar perfil')).toBeTruthy();
  expect(getByText('Bloquear usuario')).toBeTruthy();
});
