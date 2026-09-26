import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ModalRecetaRealizada } from '@/components/receta/ModalRecetaRealizada';
import { useToastStore } from '@/hooks/useToast';
import { IngredienteConsumo } from '@/services/recetaService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@/services/recetaService', () => ({
  recetaService: { marcarRealizada: jest.fn(), descontarStock: jest.fn() },
}));
jest.mock('@/services/despensaService', () => ({
  despensaService: { actualizarCantidad: jest.fn() },
}));

const { recetaService } = require('@/services/recetaService');
const { despensaService } = require('@/services/despensaService');

const mockConsumo = (overrides: Partial<IngredienteConsumo> = {}): IngredienteConsumo => ({
  nombre: 'Arroz',
  cantidadCalculada: 200,
  unidad: 'g',
  productoEnDespensa: true,
  cantidadDisponible: 500,
  suficiente: true,
  noComparable: false,
  tipoMatch: 'AUTOMATICO',
  productoId: null,
  productoNombre: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  useToastStore.setState({ visible: false, mensaje: '', tipo: 'success' });
});

it('renderiza_raciones_base_de_la_receta', () => {
  const { getByText, getByDisplayValue } = render(
    <ModalRecetaRealizada visible recetaId="r1" numPersonas={3} onClose={jest.fn()} />
  );

  expect(getByText('Esta receta es para 3 personas')).toBeTruthy();
  expect(getByDisplayValue('3')).toBeTruthy();
  expect(getByText('Has preparado para 3 personas')).toBeTruthy();
});

it('selector_raciones_actualiza_calculo_en_tiempo_real', async () => {
  recetaService.marcarRealizada.mockResolvedValue([mockConsumo({ cantidadCalculada: 200 })]);

  const { getByText, getByDisplayValue } = render(
    <ModalRecetaRealizada visible recetaId="r1" numPersonas={2} onClose={jest.fn()} />
  );

  fireEvent.press(getByText('Ver ingredientes a descontar'));
  await waitFor(() => expect(getByText('200 g')).toBeTruthy());

  // Cambiar las raciones de 2 a 2.5 debe escalar el preview ya cargado (200 -> 250)
  // sin volver a llamar al backend.
  fireEvent.changeText(getByDisplayValue('2'), '2.5');

  await waitFor(() => expect(getByText('250 g')).toBeTruthy());
  expect(recetaService.marcarRealizada).toHaveBeenCalledTimes(1);
});

it('boton_ver_ingredientes_llama_al_servicio', async () => {
  recetaService.marcarRealizada.mockResolvedValue([mockConsumo()]);

  const { getByText } = render(
    <ModalRecetaRealizada visible recetaId="receta-42" numPersonas={2} onClose={jest.fn()} />
  );

  fireEvent.press(getByText('Ver ingredientes a descontar'));

  await waitFor(() =>
    expect(recetaService.marcarRealizada).toHaveBeenCalledWith('receta-42', 2)
  );
});

it('preview_muestra_ingredientes_en_verde_naranja_y_gris', async () => {
  recetaService.marcarRealizada.mockResolvedValue([
    mockConsumo({ nombre: 'Arroz', productoEnDespensa: true, suficiente: true }),
    mockConsumo({ nombre: 'Azafrán', productoEnDespensa: true, suficiente: false, cantidadDisponible: 1 }),
    mockConsumo({ nombre: 'Pollo', productoEnDespensa: false, cantidadDisponible: 0, suficiente: false }),
  ]);

  const { getByText, UNSAFE_getAllByProps } = render(
    <ModalRecetaRealizada visible recetaId="r1" numPersonas={2} onClose={jest.fn()} />
  );

  fireEvent.press(getByText('Ver ingredientes a descontar'));

  await waitFor(() => expect(getByText('Arroz')).toBeTruthy());
  expect(getByText('Azafrán')).toBeTruthy();
  expect(getByText('Pollo')).toBeTruthy();

  expect(UNSAFE_getAllByProps({ name: 'checkmark-circle-outline' })).toHaveLength(1);
  expect(UNSAFE_getAllByProps({ name: 'warning-outline' })).toHaveLength(1);
  expect(UNSAFE_getAllByProps({ name: 'help-circle-outline' })).toHaveLength(1);
});

it('boton_descontar_llama_al_servicio_y_muestra_toast_al_cerrarse_el_modal', async () => {
  recetaService.descontarStock.mockResolvedValue({
    descontados: [mockConsumo()],
    noDisponibles: [],
    coincidenciasParciales: [],
  });
  const onClose = jest.fn();

  const { getByText, rerender } = render(
    <ModalRecetaRealizada visible recetaId="receta-42" numPersonas={2} onClose={onClose} />
  );

  fireEvent.press(getByText('Descontar de despensa'));

  await waitFor(() => expect(recetaService.descontarStock).toHaveBeenCalledWith('receta-42', 2));
  expect(onClose).toHaveBeenCalledTimes(1);

  // El toast no se dispara mientras el modal sigue montado (su <Modal> nativo lo taparía) —
  // solo al desmontarse, que es lo que hace el padre real al reaccionar a onClose.
  expect(useToastStore.getState().visible).toBe(false);
  rerender(<></>);
  expect(useToastStore.getState().tipo).toBe('success');
  expect(useToastStore.getState().mensaje).toBe('1 ingrediente descontado de tu despensa');
});

it('boton_descontar_con_coincidencias_parciales_no_cierra_y_muestra_las_preguntas_si_no', async () => {
  recetaService.descontarStock.mockResolvedValue({
    descontados: [],
    noDisponibles: [],
    coincidenciasParciales: [
      mockConsumo({ nombre: 'Carne', productoId: 'prod-1', productoNombre: 'Carne picada' }),
    ],
  });
  const onClose = jest.fn();

  const { getByText } = render(
    <ModalRecetaRealizada visible recetaId="receta-42" numPersonas={2} onClose={onClose} />
  );

  fireEvent.press(getByText('Descontar de despensa'));

  await waitFor(() =>
    expect(getByText('¿"Carne picada" de tu despensa es lo mismo que "Carne" de la receta?')).toBeTruthy()
  );
  expect(onClose).not.toHaveBeenCalled();
});

it('coincidencia_confirmada_con_si_descuenta_del_producto_candidato_y_cierra_al_no_quedar_mas', async () => {
  recetaService.descontarStock.mockResolvedValue({
    descontados: [],
    noDisponibles: [],
    coincidenciasParciales: [
      mockConsumo({
        nombre: 'Carne', cantidadCalculada: 300, cantidadDisponible: 500,
        productoId: 'prod-1', productoNombre: 'Carne picada',
      }),
    ],
  });
  despensaService.actualizarCantidad.mockResolvedValue({});
  const onClose = jest.fn();

  const { getByText } = render(
    <ModalRecetaRealizada visible recetaId="receta-42" numPersonas={2} onClose={onClose} />
  );

  fireEvent.press(getByText('Descontar de despensa'));
  await waitFor(() => expect(getByText('Sí, descontar')).toBeTruthy());

  fireEvent.press(getByText('Sí, descontar'));

  await waitFor(() =>
    expect(despensaService.actualizarCantidad).toHaveBeenCalledWith(
      'prod-1', -300, 'usado_en_receta', undefined, 'Usado en receta (confirmado): Carne picada'
    )
  );
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it('coincidencia_rechazada_con_no_no_toca_la_despensa_y_cierra_al_no_quedar_mas', async () => {
  recetaService.descontarStock.mockResolvedValue({
    descontados: [],
    noDisponibles: [],
    coincidenciasParciales: [
      mockConsumo({ nombre: 'Carne', productoId: 'prod-1', productoNombre: 'Carne picada' }),
    ],
  });
  const onClose = jest.fn();

  const { getByText } = render(
    <ModalRecetaRealizada visible recetaId="receta-42" numPersonas={2} onClose={onClose} />
  );

  fireEvent.press(getByText('Descontar de despensa'));
  await waitFor(() => expect(getByText('No, es distinto')).toBeTruthy());

  fireEvent.press(getByText('No, es distinto'));

  expect(despensaService.actualizarCantidad).not.toHaveBeenCalled();
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
});

it('boton_cerrar_cierra_sin_descontar', () => {
  const onClose = jest.fn();
  const { getByText } = render(
    <ModalRecetaRealizada visible recetaId="r1" numPersonas={2} onClose={onClose} />
  );

  fireEvent.press(getByText('Cerrar sin descontar'));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(recetaService.descontarStock).not.toHaveBeenCalled();
});
