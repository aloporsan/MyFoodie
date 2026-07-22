import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FormRecetaBasica } from '@/components/receta/FormRecetaBasica';

const onChange = jest.fn();

const defaultProps = {
  titulo: '',
  descripcion: '',
  tiempoEstimado: '',
  dificultad: '',
  categoria: '',
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
