import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { EtiquetasSelector } from '@/components/receta/EtiquetasSelector';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onChange = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('muestra_seccion_de_sugeridas', () => {
  const { getByText } = render(<EtiquetasSelector etiquetas={[]} onChange={onChange} />);
  expect(getByText('Sugeridas')).toBeTruthy();
});

it('muestra_etiquetas_activas', () => {
  const { getByText } = render(<EtiquetasSelector etiquetas={['vegano', 'saludable']} onChange={onChange} />);
  expect(getByText('vegano')).toBeTruthy();
  expect(getByText('saludable')).toBeTruthy();
});

it('llama_onChange_al_pulsar_etiqueta_sugerida', () => {
  const { getByText } = render(<EtiquetasSelector etiquetas={[]} onChange={onChange} />);
  fireEvent.press(getByText('vegano'));
  expect(onChange).toHaveBeenCalledWith(['vegano']);
});

it('no_añade_etiqueta_duplicada', () => {
  const { getByText } = render(<EtiquetasSelector etiquetas={['vegano']} onChange={onChange} />);
  const input = getByText.bind(null, 'vegano');
  expect(input).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

it('llama_onChange_sin_la_etiqueta_al_eliminarla', () => {
  const { getByPlaceholderText, getByText } = render(
    <EtiquetasSelector etiquetas={['vegano']} onChange={onChange} />
  );
  expect(getByText('vegano')).toBeTruthy();
  fireEvent.changeText(getByPlaceholderText('Añadir etiqueta personalizada...'), 'nuevo');
  expect(onChange).not.toHaveBeenCalled();
});
