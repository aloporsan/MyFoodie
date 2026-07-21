import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ResumenDespensaCard } from '@/components/dashboard/ResumenDespensaCard';
import { useRouter } from 'expo-router';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const mockPush = jest.fn();

const resumenBase = { totalProductos: 10, caducados: 1, caduca_pronto: 2, caduca_semana: 4, caduca_mes: 5, bajoStock: 3 };
const resumenVacio = { totalProductos: 0, caducados: 0, caduca_pronto: 0, caduca_semana: 0, caduca_mes: 0, bajoStock: 0 };

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

it('renderiza_seis_contadores_correctamente', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  expect(getByText('10')).toBeTruthy();
  expect(getByText('1')).toBeTruthy();
  expect(getByText('2')).toBeTruthy();
  expect(getByText('4')).toBeTruthy();
  expect(getByText('5')).toBeTruthy();
  expect(getByText('3')).toBeTruthy();
});

it('renderiza_el_titulo_Mi_despensa', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  expect(getByText('Mi despensa')).toBeTruthy();
});

it('navega_a_despensa_al_pulsar_contador_total', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  fireEvent.press(getByText('Total'));
  expect(mockPush).toHaveBeenCalledWith('/(tabs)/despensa');
});

it('navega_a_lista_filtrada_caducados_al_pulsar_contador', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  fireEvent.press(getByText('Caducados'));
  expect(mockPush).toHaveBeenCalledWith(
    expect.objectContaining({ params: expect.objectContaining({ filtro: 'caducado' }) })
  );
});

it('navega_a_lista_filtrada_caduca_pronto_al_pulsar_contador', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  fireEvent.press(getByText('Caduca pronto'));
  expect(mockPush).toHaveBeenCalledWith(
    expect.objectContaining({ params: expect.objectContaining({ filtro: 'caduca_pronto' }) })
  );
});

it('navega_a_lista_filtrada_caduca_semana_al_pulsar_contador', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  fireEvent.press(getByText('Caduca esta semana'));
  expect(mockPush).toHaveBeenCalledWith(
    expect.objectContaining({ params: expect.objectContaining({ filtro: 'caduca_semana' }) })
  );
});

it('navega_a_lista_filtrada_caduca_mes_al_pulsar_contador', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  fireEvent.press(getByText('Caduca este mes'));
  expect(mockPush).toHaveBeenCalledWith(
    expect.objectContaining({ params: expect.objectContaining({ filtro: 'caduca_mes' }) })
  );
});

it('navega_a_lista_filtrada_bajoStock_al_pulsar_contador', () => {
  const { getByText } = render(<ResumenDespensaCard resumen={resumenBase} />);
  fireEvent.press(getByText('Bajo stock'));
  expect(mockPush).toHaveBeenCalledWith(
    expect.objectContaining({ params: expect.objectContaining({ filtro: 'bajoStock' }) })
  );
});

it('renderiza_ceros_sin_errores_si_todos_los_contadores_son_cero', () => {
  const { getAllByText } = render(<ResumenDespensaCard resumen={resumenVacio} />);
  expect(getAllByText('0')).toHaveLength(6);
});
