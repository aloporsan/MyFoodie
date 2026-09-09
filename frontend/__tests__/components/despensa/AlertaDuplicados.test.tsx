import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AlertaDuplicados } from '@/components/despensa/AlertaDuplicados';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onRevisar = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('no_renderiza_nada_si_la_cantidad_es_cero', () => {
  const { queryByText } = render(<AlertaDuplicados cantidad={0} onRevisar={onRevisar} />);
  expect(queryByText('Posibles duplicados')).toBeNull();
});

it('renderiza_la_tarjeta_con_el_texto_en_singular_para_un_solo_duplicado', () => {
  const { getByText } = render(<AlertaDuplicados cantidad={1} onRevisar={onRevisar} />);
  expect(getByText('Posibles duplicados')).toBeTruthy();
  expect(getByText('Hemos detectado 1 producto que podría ser el mismo')).toBeTruthy();
});

it('renderiza_la_tarjeta_con_el_texto_en_plural_para_varios_duplicados', () => {
  const { getByText } = render(<AlertaDuplicados cantidad={3} onRevisar={onRevisar} />);
  expect(getByText('Hemos detectado 3 productos que podrías ser el mismo')).toBeTruthy();
});

it('llama_a_onRevisar_al_pulsar_la_tarjeta', () => {
  const { getByText } = render(<AlertaDuplicados cantidad={2} onRevisar={onRevisar} />);
  fireEvent.press(getByText('Revisar'));
  expect(onRevisar).toHaveBeenCalledTimes(1);
});

it('se_oculta_al_pulsar_la_x_de_cerrar_sin_llamar_a_onRevisar', () => {
  const { getByTestId, queryByText } = render(<AlertaDuplicados cantidad={2} onRevisar={onRevisar} />);
  fireEvent.press(getByTestId('alerta-duplicados-cerrar'));
  expect(queryByText('Posibles duplicados')).toBeNull();
  expect(onRevisar).not.toHaveBeenCalled();
});
