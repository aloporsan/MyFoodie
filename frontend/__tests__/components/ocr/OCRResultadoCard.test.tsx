import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { OCRResultadoCard } from '@/components/ocr/OCRResultadoCard';
import { ResultadoOCR } from '@/services/ocrService';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const onChange = jest.fn();

beforeEach(() => jest.clearAllMocks());

const resultadoNuevo: ResultadoOCR = {
  productoTicket: {
    nombreDetectado: 'Tomate Frito',
    cantidadDetectada: 2,
    unidadDetectada: null,
    lineaOriginal: '2 TOMATE FRITO',
  },
  accion: 'nuevo',
  productoExistente: null,
  similitud: null,
  mensajeSugerencia: null,
};

const productoExistente = {
  id: 'prod-1',
  despensaId: 'desp-1',
  nombre: 'Tomate',
  cantidad: 1,
  unidad: 'unidad',
  estado: 'normal' as const,
  createdAt: '2026-01-01T10:00:00',
  updatedAt: '2026-01-01T10:00:00',
};

const resultadoActualizado: ResultadoOCR = {
  productoTicket: {
    nombreDetectado: 'Tomate',
    cantidadDetectada: 1,
    unidadDetectada: null,
    lineaOriginal: 'TOMATE',
  },
  accion: 'actualizado',
  productoExistente,
  similitud: 0.95,
  mensajeSugerencia: null,
};

const resultadoSugerencia: ResultadoOCR = {
  productoTicket: {
    nombreDetectado: 'Tomate Ensalada',
    cantidadDetectada: 1,
    unidadDetectada: null,
    lineaOriginal: 'TOMATE ENSALADA',
  },
  accion: 'sugerencia',
  productoExistente,
  similitud: 0.7,
  mensajeSugerencia: "¿Es lo mismo que 'Tomate'?",
};

// -------------------------------------------------------------------------
// Ajuste inicial
// -------------------------------------------------------------------------

it('al_montar_notifica_el_ajuste_inicial_con_los_datos_detectados', () => {
  render(<OCRResultadoCard resultado={resultadoNuevo} onChange={onChange} />);

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ nombre: 'Tomate Frito', cantidad: 2, ignorado: false })
  );
});

it('edita_el_nombre_y_notifica_el_cambio', () => {
  const { getByDisplayValue } = render(
    <OCRResultadoCard resultado={resultadoNuevo} onChange={onChange} />
  );

  fireEvent.changeText(getByDisplayValue('Tomate Frito'), 'Tomate Frito Solís');

  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ nombre: 'Tomate Frito Solís' })
  );
});

// -------------------------------------------------------------------------
// Ignorar / colapso
// -------------------------------------------------------------------------

it('al_activar_ignorar_colapsa_la_tarjeta_a_una_linea', () => {
  const { getByTestId, queryByDisplayValue, getByText } = render(
    <OCRResultadoCard resultado={resultadoNuevo} onChange={onChange} />
  );

  fireEvent(getByTestId('toggle-ignorar'), 'valueChange', true);

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ ignorado: true }));
  expect(queryByDisplayValue('Tomate Frito')).toBeNull();
  expect(getByText('Tomate Frito')).toBeTruthy();
});

it('al_desactivar_ignorar_desde_la_fila_colapsada_vuelve_a_mostrar_el_formulario', () => {
  const { getByTestId, queryByDisplayValue } = render(
    <OCRResultadoCard resultado={resultadoNuevo} onChange={onChange} />
  );

  fireEvent(getByTestId('toggle-ignorar'), 'valueChange', true);
  fireEvent(getByTestId('toggle-ignorar'), 'valueChange', false);

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ ignorado: false }));
  expect(queryByDisplayValue('Tomate Frito')).toBeTruthy();
});

// -------------------------------------------------------------------------
// accion === 'actualizado'
// -------------------------------------------------------------------------

it('con_accion_actualizado_muestra_el_badge_de_producto_existente', () => {
  const { getByText } = render(
    <OCRResultadoCard resultado={resultadoActualizado} onChange={onChange} />
  );

  expect(getByText('Se actualizará Tomate')).toBeTruthy();
});

it('con_accion_actualizado_no_muestra_los_campos_de_producto_nuevo', () => {
  const { queryByText } = render(
    <OCRResultadoCard resultado={resultadoActualizado} onChange={onChange} />
  );

  expect(queryByText('Categoría (opcional)')).toBeNull();
  expect(queryByText('Marca (opcional)')).toBeNull();
});

// -------------------------------------------------------------------------
// accion === 'sugerencia'
// -------------------------------------------------------------------------

it('con_accion_sugerencia_muestra_el_mensaje_y_los_botones_si_no_se_ha_respondido', () => {
  const { getByText } = render(
    <OCRResultadoCard resultado={resultadoSugerencia} onChange={onChange} />
  );

  expect(getByText("¿Es lo mismo que 'Tomate'?")).toBeTruthy();
  expect(getByText('Sí, es lo mismo')).toBeTruthy();
  expect(getByText('No, es distinto')).toBeTruthy();
});

it('al_confirmar_que_es_lo_mismo_notifica_y_oculta_los_botones', () => {
  const { getByText, queryByText } = render(
    <OCRResultadoCard resultado={resultadoSugerencia} onChange={onChange} />
  );

  fireEvent.press(getByText('Sí, es lo mismo'));

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ confirmaSugerencia: true }));
  expect(queryByText('Sí, es lo mismo')).toBeNull();
  expect(getByText('Se fusionará con Tomate')).toBeTruthy();
});

it('al_confirmar_que_es_distinto_notifica_y_lo_indica_como_producto_nuevo', () => {
  const { getByText } = render(
    <OCRResultadoCard resultado={resultadoSugerencia} onChange={onChange} />
  );

  fireEvent.press(getByText('No, es distinto'));

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ confirmaSugerencia: false }));
  expect(getByText('Se añadirá como producto nuevo')).toBeTruthy();
});

// -------------------------------------------------------------------------
// Campos exclusivos de producto nuevo (categoría, marca, stock mínimo, notas)
// -------------------------------------------------------------------------

it('con_accion_nuevo_seleccionar_una_categoria_notifica_el_cambio', () => {
  const { getByText } = render(
    <OCRResultadoCard resultado={resultadoNuevo} onChange={onChange} />
  );

  fireEvent.press(getByText('Bebidas'));

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ categoria: 'Bebidas' }));
});

it('con_accion_nuevo_volver_a_pulsar_la_misma_categoria_la_deselecciona', () => {
  const { getByText } = render(
    <OCRResultadoCard resultado={resultadoNuevo} onChange={onChange} />
  );

  fireEvent.press(getByText('Bebidas'));
  fireEvent.press(getByText('Bebidas'));

  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ categoria: null }));
});
