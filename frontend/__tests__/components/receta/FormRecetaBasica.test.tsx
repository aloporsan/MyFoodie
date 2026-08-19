import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FormRecetaBasica } from '@/components/receta/FormRecetaBasica';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onChange = jest.fn();

const defaultProps = {
  titulo: '',
  descripcion: '',
  tiempoEstimado: '',
  dificultad: '',
  categoria: '',
  numPersonas: '2',
  onChange,
};

beforeEach(() => jest.clearAllMocks());

it('renderiza_los_campos_del_formulario', () => {
  const { getByPlaceholderText } = render(<FormRecetaBasica {...defaultProps} />);
  expect(getByPlaceholderText('ej. Tortilla española')).toBeTruthy();
  expect(getByPlaceholderText('Describe brevemente tu receta...')).toBeTruthy();
  expect(getByPlaceholderText('ej. 30')).toBeTruthy();
});

it('llama_onChange_al_escribir_en_titulo', () => {
  const { getByPlaceholderText } = render(<FormRecetaBasica {...defaultProps} />);
  fireEvent.changeText(getByPlaceholderText('ej. Tortilla española'), 'Tortilla');
  expect(onChange).toHaveBeenCalledWith('titulo', 'Tortilla');
});

it('muestra_error_de_titulo_cuando_se_provee', () => {
  const { getByText } = render(
    <FormRecetaBasica {...defaultProps} errores={{ titulo: 'El título es obligatorio' }} />
  );
  expect(getByText('El título es obligatorio')).toBeTruthy();
});

it('llama_onChange_al_pulsar_chip_de_dificultad', () => {
  const { getByText } = render(<FormRecetaBasica {...defaultProps} />);
  fireEvent.press(getByText('Fácil'));
  expect(onChange).toHaveBeenCalledWith('dificultad', 'Fácil');
});

it('llama_onChange_al_pulsar_chip_de_categoria', () => {
  const { getByText } = render(<FormRecetaBasica {...defaultProps} />);
  fireEvent.press(getByText('Postre'));
  expect(onChange).toHaveBeenCalledWith('categoria', 'Postre');
});

it('campo_numPersonas_renderiza_con_valor_por_defecto_2', () => {
  const { getByTestId } = render(<FormRecetaBasica {...defaultProps} />);
  expect(getByTestId('valor-num-personas').props.children).toBe(2);
});

it('campo_numPersonas_acepta_valores_entre_1_y_20', () => {
  const { getByTestId, rerender } = render(<FormRecetaBasica {...defaultProps} numPersonas="2" />);
  fireEvent.press(getByTestId('btn-sumar-num-personas'));
  expect(onChange).toHaveBeenCalledWith('numPersonas', '3');

  onChange.mockClear();
  rerender(<FormRecetaBasica {...defaultProps} numPersonas="20" />);
  fireEvent.press(getByTestId('btn-sumar-num-personas'));
  expect(onChange).not.toHaveBeenCalled();

  onChange.mockClear();
  rerender(<FormRecetaBasica {...defaultProps} numPersonas="1" />);
  fireEvent.press(getByTestId('btn-restar-num-personas'));
  expect(onChange).not.toHaveBeenCalled();
});
