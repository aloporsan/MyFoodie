import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FiltroFeedBar } from '@/components/feed/FiltroFeedBar';
import { FILTROS_RECETA_VACIOS } from '@/constants/filtrosReceta';
import { useFeedStore } from '@/store/feedStore';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@/services/apiClient', () => ({ apiClient: { get: jest.fn() }, setTokenGetter: jest.fn() }));
jest.mock('@/services/feedService', () => ({ feedService: { obtenerFeed: jest.fn(), obtenerRecetasSeguidos: jest.fn() } }));
// El sheet real es un Modal pesado; aquí solo interesa la barra.
jest.mock('@/components/feed/FiltrosRecetaSheet', () => ({ FiltrosRecetaSheet: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  useFeedStore.setState({ filtros: FILTROS_RECETA_VACIOS });
});

it('cambia_de_fuente_al_pulsar_un_chip', () => {
  const onFiltroChange = jest.fn();
  const { getByTestId } = render(
    <FiltroFeedBar filtroActivo="para-ti" onFiltroChange={onFiltroChange} />
  );

  fireEvent.press(getByTestId('filtro-chip-seguidos'));

  expect(onFiltroChange).toHaveBeenCalledWith('seguidos');
});

it('el_boton_de_filtros_no_muestra_badge_sin_filtros_activos', () => {
  const { getByTestId, queryByText } = render(
    <FiltroFeedBar filtroActivo="para-ti" onFiltroChange={jest.fn()} />
  );

  expect(getByTestId('btn-abrir-filtros')).toBeTruthy();
  expect(queryByText('2')).toBeNull();
});

it('el_boton_de_filtros_muestra_el_numero_de_filtros_activos', () => {
  useFeedStore.setState({
    filtros: { ...FILTROS_RECETA_VACIOS, categorias: ['Postre'], dificultades: ['Fácil'] },
  });

  const { getByText } = render(<FiltroFeedBar filtroActivo="para-ti" onFiltroChange={jest.fn()} />);

  expect(getByText('2')).toBeTruthy();
});
