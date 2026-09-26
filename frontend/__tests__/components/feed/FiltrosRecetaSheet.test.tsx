import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { FiltrosRecetaSheet } from '@/components/feed/FiltrosRecetaSheet';
import { FILTROS_RECETA_VACIOS } from '@/constants/filtrosReceta';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const onAplicar = jest.fn();
const onCerrar = jest.fn();

beforeEach(() => jest.clearAllMocks());

it('aplica_los_chips_seleccionados_de_varias_dimensiones_al_pulsar_Aplicar', () => {
  const { getByTestId } = render(
    <FiltrosRecetaSheet visible filtros={FILTROS_RECETA_VACIOS} onAplicar={onAplicar} onCerrar={onCerrar} />
  );

  fireEvent.press(getByTestId('filtro-categoria-Postre'));
  fireEvent.press(getByTestId('filtro-dificultad-Fácil'));
  fireEvent.press(getByTestId('filtro-tiempo-0-15'));
  fireEvent.press(getByTestId('filtros-aplicar'));

  expect(onAplicar).toHaveBeenCalledWith(
    expect.objectContaining({ categorias: ['Postre'], dificultades: ['Fácil'], tiempos: ['0-15'] })
  );
});

it('re-pulsar_un_chip_lo_deselecciona', () => {
  const { getByTestId } = render(
    <FiltrosRecetaSheet visible filtros={FILTROS_RECETA_VACIOS} onAplicar={onAplicar} onCerrar={onCerrar} />
  );

  fireEvent.press(getByTestId('filtro-categoria-Postre'));
  fireEvent.press(getByTestId('filtro-categoria-Postre'));
  fireEvent.press(getByTestId('filtros-aplicar'));

  expect(onAplicar).toHaveBeenCalledWith(expect.objectContaining({ categorias: [] }));
});

it('Limpiar_devuelve_el_borrador_a_los_filtros_vacíos', () => {
  const { getByTestId } = render(
    <FiltrosRecetaSheet visible filtros={FILTROS_RECETA_VACIOS} onAplicar={onAplicar} onCerrar={onCerrar} />
  );

  fireEvent.press(getByTestId('filtro-etiqueta-vegano'));
  fireEvent.press(getByTestId('filtros-limpiar'));
  fireEvent.press(getByTestId('filtros-aplicar'));

  expect(onAplicar).toHaveBeenCalledWith(FILTROS_RECETA_VACIOS);
});

it('el_switch_de_despensa_solo_se_muestra_con_mostrarDespensa', () => {
  const sin = render(
    <FiltrosRecetaSheet visible filtros={FILTROS_RECETA_VACIOS} onAplicar={onAplicar} onCerrar={onCerrar} />
  );
  expect(sin.queryByTestId('filtro-solo-despensa')).toBeNull();

  const con = render(
    <FiltrosRecetaSheet visible mostrarDespensa filtros={FILTROS_RECETA_VACIOS} onAplicar={onAplicar} onCerrar={onCerrar} />
  );
  expect(con.getByTestId('filtro-solo-despensa')).toBeTruthy();
});

it('activa_soloDespensa_al_pulsar_la_tarjeta_del_switch', () => {
  const { getByTestId } = render(
    <FiltrosRecetaSheet visible mostrarDespensa filtros={FILTROS_RECETA_VACIOS} onAplicar={onAplicar} onCerrar={onCerrar} />
  );

  fireEvent.press(getByTestId('filtro-solo-despensa'));
  fireEvent.press(getByTestId('filtros-aplicar'));

  expect(onAplicar).toHaveBeenCalledWith(expect.objectContaining({ soloDespensa: true }));
});
