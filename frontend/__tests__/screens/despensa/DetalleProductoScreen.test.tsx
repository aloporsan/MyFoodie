import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { useConfirmStore } from '@/hooks/useConfirm';
import { DetalleProductoScreen } from '@/screens/despensa/DetalleProductoScreen';
import { useDespensaStore } from '@/store/despensaStore';
import { useLocalSearchParams, useRouter } from 'expo-router';

function renderConModal() {
  return render(
    <>
      <DetalleProductoScreen />
      <ConfirmModal />
    </>
  );
}

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
  useFocusEffect: (cb: () => void) => cb(),
}));
jest.mock('@/store/despensaStore', () => ({ useDespensaStore: jest.fn() }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockActualizarCantidad = jest.fn();
const mockEliminarProducto = jest.fn();
const mockCargarHistorial = jest.fn();
const mockCargarLotes = jest.fn();
const mockActivarLotes = jest.fn();
const mockAñadirLote = jest.fn();
const mockEditarLote = jest.fn();
const mockEliminarLote = jest.fn();
const mockCompactarLotes = jest.fn();

const mockProducto = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Leche Entera',
  cantidad: 3,
  unidad: 'litros',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const mockLote = (overrides: Partial<any> = {}) => ({
  id: 'lote-1',
  productoId: 'prod-1',
  despensaId: 'desp-1',
  cantidad: 2,
  unidad: 'litros',
  estado: 'normal' as const,
  fechaCaducidad: '2026-02-01',
  fechaCompra: '2026-01-01',
  origen: 'manual',
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
  ...overrides,
});

const mockHistorial = [
  {
    id: 'mov-1',
    tipo: 'cantidad_actualizada' as const,
    descripcion: 'Cantidad actualizada',
    cantidadAnterior: 5,
    cantidadNueva: 3,
    motivo: 'consumido' as const,
    motivoDetalle: null,
    createdAt: '2026-01-02T10:00:00',
  },
];

const storeBase = {
  productos: [mockProducto],
  historialProducto: mockHistorial,
  actualizarCantidad: mockActualizarCantidad,
  eliminarProducto: mockEliminarProducto,
  cargarHistorial: mockCargarHistorial,
  lotesProductoActual: [] as ReturnType<typeof mockLote>[],
  cargarLotes: mockCargarLotes,
  activarLotes: mockActivarLotes,
  añadirLote: mockAñadirLote,
  editarLote: mockEditarLote,
  eliminarLote: mockEliminarLote,
  compactarLotes: mockCompactarLotes,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, back: mockBack });
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'prod-1' });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue(storeBase);
  mockActualizarCantidad.mockResolvedValue({ ...mockProducto, consumosFifo: null });
  useConfirmStore.setState({
    visible: false, title: '', message: undefined, icon: undefined, variant: 'default', buttons: [],
  });
});

// -------------------------------------------------------------------------
// positivos
// -------------------------------------------------------------------------

it('renderiza_el_nombre_del_producto', () => {
  const { getAllByText } = render(<DetalleProductoScreen />);
  expect(getAllByText('Leche Entera').length).toBeGreaterThan(0);
});

it('llama_cargarHistorial_al_ganar_foco', () => {
  render(<DetalleProductoScreen />);
  expect(mockCargarHistorial).toHaveBeenCalledWith('prod-1');
});

it('renderiza_el_historial_con_delta_chip_negativo', () => {
  const { getByText } = render(<DetalleProductoScreen />);
  expect(getByText('Historial')).toBeTruthy();
  expect(getByText('-2')).toBeTruthy();
});

it('renderiza_delta_chip_positivo_cuando_la_cantidad_aumenta', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    historialProducto: [
      { ...mockHistorial[0], cantidadAnterior: 1, cantidadNueva: 4 },
    ],
  });
  const { getByText } = render(<DetalleProductoScreen />);
  expect(getByText('+3')).toBeTruthy();
});

it('no_renderiza_seccion_historial_si_esta_vacio', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    historialProducto: [],
  });
  const { queryByText } = render(<DetalleProductoScreen />);
  expect(queryByText('Historial')).toBeNull();
});

it('abre_CantidadMotivoSheet_en_modo_restar_al_pulsar_menos', () => {
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);
  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMenos = iconos.find((i: any) => i.props.name === 'remove');
  fireEvent.press(btnMenos!.parent as any);
  expect(getByText('¿Cuánto has usado?')).toBeTruthy();
});

it('abre_CantidadMotivoSheet_en_modo_sumar_al_pulsar_mas', () => {
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);
  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMas = iconos.find((i: any) => i.props.name === 'add');
  fireEvent.press(btnMas!.parent as any);
  expect(getByText('¿Cuánto añades?')).toBeTruthy();
});

it('boton_menos_deshabilitado_cuando_cantidad_es_cero', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, cantidad: 0 }],
  });
  const { queryByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);
  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMenos = iconos.find((i: any) => i.props.name === 'remove');
  fireEvent.press(btnMenos!.parent as any);
  expect(queryByText('¿Cuánto has usado?')).toBeNull();
});

it('confirmar_sheet_en_modo_sumar_llama_actualizarCantidad_con_delta_positivo', async () => {
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);
  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMas = iconos.find((i: any) => i.props.name === 'add');
  fireEvent.press(btnMas!.parent as any);
  fireEvent.press(getByText('Añadir'));
  await waitFor(() => {
    expect(mockActualizarCantidad).toHaveBeenCalledWith('prod-1', 1, undefined, undefined);
  });
});

it('abre_modal_de_motivo_al_pulsar_eliminar_producto', () => {
  const { getByText } = render(<DetalleProductoScreen />);
  fireEvent.press(getByText('Eliminar producto'));
  expect(getByText('¿Por qué eliminas este producto?')).toBeTruthy();
});

it('confirmar_eliminacion_con_motivo_llama_eliminarProducto_y_vuelve_atras', async () => {
  const { getByText } = render(<DetalleProductoScreen />);
  fireEvent.press(getByText('Eliminar producto'));
  fireEvent.press(getByText('Caducado'));
  fireEvent.press(getByText('Eliminar'));
  await waitFor(() => {
    expect(mockEliminarProducto).toHaveBeenCalledWith('prod-1', 'caducado', undefined);
    expect(mockBack).toHaveBeenCalled();
  });
});

it('boton_eliminar_del_modal_esta_deshabilitado_sin_motivo_seleccionado', async () => {
  const { getByText } = render(<DetalleProductoScreen />);
  fireEvent.press(getByText('Eliminar producto'));
  fireEvent.press(getByText('Eliminar'));
  await waitFor(() => {
    expect(mockEliminarProducto).not.toHaveBeenCalled();
  });
});

// -------------------------------------------------------------------------
// negativos
// -------------------------------------------------------------------------

it('muestra_producto_no_encontrado_si_el_id_no_coincide', () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'no-existe' });
  const { getByText } = render(<DetalleProductoScreen />);
  expect(getByText('Producto no encontrado')).toBeTruthy();
});

// -------------------------------------------------------------------------
// Gestión por lotes
// -------------------------------------------------------------------------

it('llama_cargarLotes_al_ganar_foco', () => {
  render(<DetalleProductoScreen />);
  expect(mockCargarLotes).toHaveBeenCalledWith('prod-1');
});

it('boton_gestionar_por_lotes_activa_lotes_y_revela_la_seccion', async () => {
  mockActivarLotes.mockResolvedValue(undefined);
  const { getByText, queryByText } = render(<DetalleProductoScreen />);

  expect(queryByText('Lotes')).toBeNull();
  fireEvent.press(getByText('Gestionar por lotes'));

  await waitFor(() => expect(mockActivarLotes).toHaveBeenCalledWith('prod-1'));
  await waitFor(() => expect(getByText('Lotes')).toBeTruthy());
});

it('no_muestra_boton_gestionar_por_lotes_si_el_producto_ya_tiene_lotes', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, tieneLotes: true }],
    lotesProductoActual: [mockLote()],
  });
  const { queryByText, getByText } = render(<DetalleProductoScreen />);
  expect(queryByText('Gestionar por lotes')).toBeNull();
  expect(getByText('Lotes')).toBeTruthy();
});

it('boton_compactar_lotes_no_aparece_con_un_unico_lote', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, tieneLotes: true }],
    lotesProductoActual: [mockLote()],
  });
  const { queryByText } = render(<DetalleProductoScreen />);
  expect(queryByText('Compactar lotes')).toBeNull();
});

it('boton_compactar_lotes_pregunta_criterio_y_llama_compactarLotes_con_la_eleccion', async () => {
  mockCompactarLotes.mockResolvedValue(undefined);
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, tieneLotes: true }],
    lotesProductoActual: [mockLote(), mockLote({ id: 'lote-2', fechaCaducidad: '2026-03-01' })],
  });
  const { getByText } = renderConModal();

  fireEvent.press(getByText('Compactar lotes'));
  expect(getByText('La fecha más próxima')).toBeTruthy();

  fireEvent.press(getByText('La fecha más próxima'));

  await waitFor(() =>
    expect(mockCompactarLotes).toHaveBeenCalledWith('prod-1', 'MAS_TEMPRANA')
  );
});

it('pulsar_mas_en_producto_con_lotes_abre_el_selector_de_lote_en_vez_del_sheet_de_cantidad', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, tieneLotes: true }],
    lotesProductoActual: [mockLote()],
  });
  const { getByText, queryByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);

  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMas = iconos.find((i: any) => i.props.name === 'add');
  fireEvent.press(btnMas!.parent as any);

  expect(getByText('¿A qué lote añades stock?')).toBeTruthy();
  expect(getByText('Añadir a un lote nuevo')).toBeTruthy();
  expect(queryByText('¿Cuánto añades?')).toBeNull();
});

it('elegir_un_lote_del_selector_abre_el_sheet_de_cantidad_y_al_confirmar_edita_ese_lote', async () => {
  const lote = mockLote({ cantidad: 2, unidad: 'litros' });
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, tieneLotes: true }],
    lotesProductoActual: [lote],
  });
  mockEditarLote.mockResolvedValue(undefined);
  const { getByText, getAllByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);

  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMas = iconos.find((i: any) => i.props.name === 'add');
  fireEvent.press(btnMas!.parent as any);

  // La misma tarjeta de lote aparece en la sección "Lotes" (modo gestión) y en el selector
  // modal recién abierto (modo selección) — la del selector es la que va después en el árbol.
  const apariciones = getAllByText('2 litros');
  const cantidadTexto = apariciones[apariciones.length - 1];
  fireEvent.press(cantidadTexto.parent!.parent!.parent as any);

  expect(getByText('¿Cuánto añades?')).toBeTruthy();

  fireEvent.press(getByText('Añadir'));

  await waitFor(() =>
    expect(mockEditarLote).toHaveBeenCalledWith('prod-1', lote.id, {
      cantidad: lote.cantidad + 1,
      unidad: lote.unidad,
      fechaCaducidad: lote.fechaCaducidad,
      fechaCompra: lote.fechaCompra,
      origen: lote.origen,
    })
  );
});

it('elegir_lote_nuevo_desde_el_selector_abre_el_formulario_de_nueva_compra', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, tieneLotes: true }],
    lotesProductoActual: [mockLote()],
  });
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);

  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMas = iconos.find((i: any) => i.props.name === 'add');
  fireEvent.press(btnMas!.parent as any);

  fireEvent.press(getByText('Añadir a un lote nuevo'));

  expect(getByText('Nueva compra')).toBeTruthy();
});

it('avisoRestar_indica_el_lote_que_se_consumira_antes_de_restar', () => {
  (useDespensaStore as unknown as jest.Mock).mockReturnValue({
    ...storeBase,
    productos: [{ ...mockProducto, tieneLotes: true }],
    lotesProductoActual: [mockLote({ cantidad: 2, unidad: 'litros', fechaCaducidad: '2026-02-01' })],
  });
  const { getByText, UNSAFE_getAllByType } = render(<DetalleProductoScreen />);

  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMenos = iconos.find((i: any) => i.props.name === 'remove');
  fireEvent.press(btnMenos!.parent as any);

  expect(getByText(/Se descontará primero del lote que caduca el 01\/02\/2026 \(2 litros\)\./)).toBeTruthy();
});

it('confirmar_resta_con_consumosFifo_muestra_el_resumen_de_lotes_consumidos', async () => {
  mockActualizarCantidad.mockResolvedValue({
    ...mockProducto,
    consumosFifo: [
      { loteId: 'lote-1', fechaCaducidad: '2026-02-01', cantidadConsumida: 1, cantidadRestante: 1, loteEliminado: false },
    ],
  });
  const { getByText, UNSAFE_getAllByType } = renderConModal();

  const iconos = UNSAFE_getAllByType('Ionicons' as any);
  const btnMenos = iconos.find((i: any) => i.props.name === 'remove');
  fireEvent.press(btnMenos!.parent as any);
  fireEvent.press(getByText('Consumido'));
  fireEvent.press(getByText('Registrar uso'));

  await waitFor(() => expect(getByText('Consumido de tus lotes')).toBeTruthy());
});
