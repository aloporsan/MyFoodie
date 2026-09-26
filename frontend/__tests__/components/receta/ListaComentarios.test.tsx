import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ListaComentarios } from '@/components/receta/ListaComentarios';
import { Comentario, comentarioService } from '@/services/comentarioService';
import { useConfirmStore } from '@/hooks/useConfirm';
import { useToastStore } from '@/hooks/useToast';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/services/comentarioService');
jest.mock('@/services/reporteService');

const mockService = comentarioService as jest.Mocked<typeof comentarioService>;

function comentario(overrides: Partial<Comentario> = {}): Comentario {
  return {
    id: 'c-1',
    usuarioId: 'user-1',
    nombreUsuario: 'ana',
    texto: 'texto',
    createdAt: new Date().toISOString(),
    esAutor: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useConfirmStore.setState({ visible: false, title: '', message: undefined, buttons: [] });
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
});

it('renderiza_comentarios_ordenados', async () => {
  mockService.obtenerComentarios.mockResolvedValue([
    comentario({ id: 'c-nuevo', texto: 'el más nuevo' }),
    comentario({ id: 'c-viejo', texto: 'el más viejo' }),
  ]);

  const { getByText } = render(<ListaComentarios recetaId="receta-1" />);

  await waitFor(() => {
    expect(getByText('el más nuevo')).toBeTruthy();
    expect(getByText('el más viejo')).toBeTruthy();
  });
});

it('boton_eliminar_visible_solo_para_autor', async () => {
  mockService.obtenerComentarios.mockResolvedValue([
    comentario({ id: 'mio', esAutor: true }),
    comentario({ id: 'ajeno', esAutor: false }),
  ]);

  const { getAllByTestId, queryAllByTestId } = render(<ListaComentarios recetaId="receta-1" />);

  await waitFor(() => {
    expect(getAllByTestId('btn-eliminar-comentario')).toHaveLength(1);
    expect(queryAllByTestId('btn-opciones-comentario')).toHaveLength(1);
  });
});

it('enviar_un_comentario_llama_a_crearComentario_y_lo_muestra', async () => {
  mockService.obtenerComentarios.mockResolvedValue([]);
  mockService.crearComentario.mockResolvedValue(comentario({ id: 'nuevo', texto: 'recién escrito' }));

  const { getByTestId, getByText } = render(<ListaComentarios recetaId="receta-1" />);
  await waitFor(() => expect(getByText('Sé el primero en comentar')).toBeTruthy());

  fireEvent.changeText(getByTestId('input-comentario'), 'recién escrito');
  fireEvent.press(getByTestId('btn-enviar-comentario'));

  await waitFor(() => {
    expect(mockService.crearComentario).toHaveBeenCalledWith('receta-1', 'recién escrito');
    expect(getByText('recién escrito')).toBeTruthy();
  });
});

it('eliminar_un_comentario_propio_confirma_y_llama_al_servicio', async () => {
  mockService.obtenerComentarios.mockResolvedValue([comentario({ id: 'mio', esAutor: true })]);
  mockService.eliminarComentario.mockResolvedValue(undefined);

  const { getByTestId } = render(<ListaComentarios recetaId="receta-1" />);
  await waitFor(() => expect(getByTestId('btn-eliminar-comentario')).toBeTruthy());

  fireEvent.press(getByTestId('btn-eliminar-comentario'));
  const confirmar = useConfirmStore.getState().buttons.find((b) => b.text === 'Eliminar');
  await confirmar?.onPress?.();

  expect(mockService.eliminarComentario).toHaveBeenCalledWith('receta-1', 'mio');
});
