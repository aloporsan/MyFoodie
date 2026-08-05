import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ModalCompartir } from '@/components/compartir/ModalCompartir';
import { UsuarioBusqueda, socialService } from '@/services/socialService';
import { compartirService } from '@/services/compartirService';
import { useCompartirStore } from '@/store/compartirStore';
import { useSocialStore } from '@/store/socialStore';
import { useToastStore } from '@/hooks/useToast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@/services/socialService');
jest.mock('@/services/compartirService');

const mockSocialService = socialService as jest.Mocked<typeof socialService>;
const mockCompartirService = compartirService as jest.Mocked<typeof compartirService>;

function usuario(overrides: Partial<UsuarioBusqueda> = {}): UsuarioBusqueda {
  return {
    id: 'user-1',
    nombre: 'Ana García',
    nombreUsuario: 'anagarcia',
    fotoPerfil: null,
    numRecetas: 3,
    esSeguido: false,
    haSolicitado: false,
    ...overrides,
  };
}

const onClose = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  useSocialStore.setState({ resultadosBusqueda: [], isLoading: false, error: null });
  useCompartirStore.setState({ isLoading: false, error: null });
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
});

afterEach(() => {
  jest.useRealTimers();
});

function buscarYSeleccionar(getByTestId: any, u: UsuarioBusqueda) {
  fireEvent.changeText(getByTestId('input-buscar-usuarios'), u.nombreUsuario);
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

it('renderiza_buscador_y_boton_compartir', () => {
  const { getByTestId, getByText } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );
  expect(getByTestId('input-buscar-usuarios')).toBeTruthy();
  expect(getByText('Compartir')).toBeTruthy();
});

it('boton_compartir_deshabilitado_sin_receptores', () => {
  const { getByText } = render(<ModalCompartir visible recetaId="receta-1" onClose={onClose} />);

  fireEvent.press(getByText('Compartir'));

  expect(mockCompartirService.compartirReceta).not.toHaveBeenCalled();
});

it('boton_compartir_habilitado_con_al_menos_un_receptor', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuario()]);
  mockCompartirService.compartirReceta.mockResolvedValue([]);
  const { getByTestId, getByText, findByTestId } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );

  buscarYSeleccionar(getByTestId, usuario());
  fireEvent.press(await findByTestId('resultado-usuario-user-1'));

  await act(async () => {
    fireEvent.press(getByText('Compartir'));
  });

  expect(mockCompartirService.compartirReceta).toHaveBeenCalledWith('receta-1', ['user-1'], undefined);
});

it('muestra_chip_por_cada_usuario_seleccionado', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuario()]);
  const { getByTestId, findByTestId } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );

  buscarYSeleccionar(getByTestId, usuario());
  fireEvent.press(await findByTestId('resultado-usuario-user-1'));

  expect(await findByTestId('chip-usuario-user-1')).toBeTruthy();
});

it('elimina_usuario_al_pulsar_x_en_chip', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuario()]);
  const { getByTestId, findByTestId, queryByTestId } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );

  buscarYSeleccionar(getByTestId, usuario());
  fireEvent.press(await findByTestId('resultado-usuario-user-1'));
  expect(await findByTestId('chip-usuario-user-1')).toBeTruthy();

  fireEvent.press(getByTestId('btn-quitar-user-1'));

  expect(queryByTestId('chip-usuario-user-1')).toBeNull();
});

it('contador_caracteres_se_actualiza_al_escribir_mensaje', () => {
  const { getByTestId } = render(<ModalCompartir visible recetaId="receta-1" onClose={onClose} />);

  fireEvent.changeText(getByTestId('input-mensaje'), 'Hola');

  expect(getByTestId('contador-caracteres').props.children.join('')).toBe('4/200');
});

it('no_permite_mas_de_10_receptores', async () => {
  const usuarios = Array.from({ length: 10 }, (_, i) => usuario({ id: `user-${i}`, nombreUsuario: `user${i}` }));
  const undecimo = usuario({ id: 'user-10', nombreUsuario: 'user10' });
  mockSocialService.buscarUsuarios.mockResolvedValue(usuarios);
  const { getByTestId, findByTestId } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );

  buscarYSeleccionar(getByTestId, usuarios[0]);
  for (let i = 0; i < 10; i++) {
    fireEvent.press(await findByTestId(`resultado-usuario-user-${i}`));
  }

  mockSocialService.buscarUsuarios.mockResolvedValue([undecimo]);
  buscarYSeleccionar(getByTestId, undecimo);
  fireEvent.press(await findByTestId('resultado-usuario-user-10'));

  expect(useToastStore.getState().tipo).toBe('warning');
  expect(useToastStore.getState().mensaje).toBe('Puedes compartir con un máximo de 10 usuarios');
});

it('llama_compartirReceta_al_pulsar_boton', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuario()]);
  mockCompartirService.compartirReceta.mockResolvedValue([]);
  const { getByTestId, getByText, findByTestId } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );

  buscarYSeleccionar(getByTestId, usuario());
  fireEvent.press(await findByTestId('resultado-usuario-user-1'));

  await act(async () => {
    fireEvent.press(getByText('Compartir'));
  });

  expect(mockCompartirService.compartirReceta).toHaveBeenCalledWith('receta-1', ['user-1'], undefined);
  expect(onClose).toHaveBeenCalled();
});

it('muestra_toast_exito_tras_compartir', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuario()]);
  mockCompartirService.compartirReceta.mockResolvedValue([]);
  const { getByTestId, getByText, findByTestId } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );

  buscarYSeleccionar(getByTestId, usuario());
  fireEvent.press(await findByTestId('resultado-usuario-user-1'));

  await act(async () => {
    fireEvent.press(getByText('Compartir'));
  });

  expect(useToastStore.getState().tipo).toBe('success');
  expect(useToastStore.getState().mensaje).toBe('Receta compartida con 1 usuarios');
});

it('busca_usuarios_con_soloCompartibles_activado', () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuario()]);
  const { getByTestId } = render(<ModalCompartir visible recetaId="receta-1" onClose={onClose} />);

  buscarYSeleccionar(getByTestId, usuario());

  expect(mockSocialService.buscarUsuarios).toHaveBeenCalledWith('anagarcia', true);
});

it('muestra_toast_error_si_backend_devuelve_403', async () => {
  mockSocialService.buscarUsuarios.mockResolvedValue([usuario()]);
  mockCompartirService.compartirReceta.mockRejectedValue(
    new Error('No puedes enviar recetas a este usuario porque su perfil es privado')
  );
  const { getByTestId, getByText, findByTestId } = render(
    <ModalCompartir visible recetaId="receta-1" onClose={onClose} />
  );

  buscarYSeleccionar(getByTestId, usuario());
  fireEvent.press(await findByTestId('resultado-usuario-user-1'));

  await act(async () => {
    fireEvent.press(getByText('Compartir'));
  });

  expect(useToastStore.getState().tipo).toBe('error');
  expect(useToastStore.getState().mensaje).toBe(
    'No puedes enviar recetas a este usuario porque su perfil es privado'
  );
});
