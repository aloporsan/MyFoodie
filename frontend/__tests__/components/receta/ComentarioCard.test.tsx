import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ComentarioCard } from '@/components/receta/ComentarioCard';
import { Comentario } from '@/services/comentarioService';
import { useConfirmStore } from '@/hooks/useConfirm';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

function comentario(overrides: Partial<Comentario> = {}): Comentario {
  return {
    id: 'c-1',
    usuarioId: 'user-1',
    nombreUsuario: 'ana',
    texto: 'Qué buena pinta',
    createdAt: new Date().toISOString(),
    esAutor: false,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useConfirmStore.setState({ visible: false, title: '', message: undefined, buttons: [] });
});

it('muestra_nombre_y_texto_del_comentario', () => {
  const { getByText } = render(<ComentarioCard comentario={comentario()} />);
  expect(getByText('@ana')).toBeTruthy();
  expect(getByText('Qué buena pinta')).toBeTruthy();
});

it('boton_eliminar_visible_solo_para_autor', () => {
  const onEliminar = jest.fn();
  const propio = render(
    <ComentarioCard comentario={comentario({ esAutor: true })} onEliminar={onEliminar} />
  );
  expect(propio.getByTestId('btn-eliminar-comentario')).toBeTruthy();
  expect(propio.queryByTestId('btn-opciones-comentario')).toBeNull();

  const ajeno = render(
    <ComentarioCard comentario={comentario({ esAutor: false })} onEliminar={onEliminar} onReportar={jest.fn()} />
  );
  expect(ajeno.queryByTestId('btn-eliminar-comentario')).toBeNull();
  expect(ajeno.getByTestId('btn-opciones-comentario')).toBeTruthy();
});

it('el_boton_opciones_ofrece_reportar_el_comentario', () => {
  const onReportar = jest.fn();
  const c = comentario({ esAutor: false });
  const { getByTestId } = render(<ComentarioCard comentario={c} onReportar={onReportar} />);

  fireEvent.press(getByTestId('btn-opciones-comentario'));
  const boton = useConfirmStore.getState().buttons.find((b) => b.text === 'Reportar comentario');
  boton?.onPress?.();

  expect(onReportar).toHaveBeenCalledWith(c);
});
