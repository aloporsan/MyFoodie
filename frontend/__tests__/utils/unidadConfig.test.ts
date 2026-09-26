import {
  convertirCantidad,
  equivalenciaMetrica,
  esUnidadSubjetiva,
  etiquetaUnidad,
  unidadDeCompra,
} from '@/utils/unidadConfig';

// -------------------------------------------------------------------------
// convertirCantidad — mismo espejo que UnidadNormalizadorService.convertirCantidad
// del backend, usado en el preview de fusión de duplicados (RF-DESP-022)
// -------------------------------------------------------------------------

it('convertirCantidad_convierte_litros_a_mililitros', () => {
  expect(convertirCantidad(2, 'l', 'ml')).toBe(2000);
});

it('convertirCantidad_convierte_mililitros_a_litros', () => {
  expect(convertirCantidad(500, 'ml', 'l')).toBe(0.5);
});

it('convertirCantidad_convierte_kilos_a_gramos', () => {
  expect(convertirCantidad(1.5, 'kg', 'g')).toBe(1500);
});

it('convertirCantidad_devuelve_la_misma_cantidad_si_origen_y_destino_son_iguales', () => {
  expect(convertirCantidad(3, 'kg', 'kg')).toBe(3);
});

it('convertirCantidad_es_insensible_a_mayusculas', () => {
  expect(convertirCantidad(2, 'L', 'ML')).toBe(2000);
});

it('convertirCantidad_devuelve_null_si_las_familias_son_distintas', () => {
  expect(convertirCantidad(1, 'l', 'kg')).toBeNull();
});

it('convertirCantidad_devuelve_null_para_unidades_no_objetivas', () => {
  expect(convertirCantidad(3, 'unidad', 'kg')).toBeNull();
});

// -------------------------------------------------------------------------
// esUnidadSubjetiva / etiquetaUnidad / equivalenciaMetrica / unidadDeCompra
// (comportamiento ya existente, cubierto aquí para acompañar el nuevo convertirCantidad)
// -------------------------------------------------------------------------

it('esUnidadSubjetiva_detecta_cucharada_y_taza_como_subjetivas', () => {
  expect(esUnidadSubjetiva('cucharada')).toBe(true);
  expect(esUnidadSubjetiva('taza')).toBe(true);
  expect(esUnidadSubjetiva('kg')).toBe(false);
});

// HOTFIX: solo se reconocían las formas en singular, así que "2 cucharadas" (como las guarda
// el buscador de recetas y los datos de ejemplo, p. ej. "Pad thai de pollo") no se convertía
// aquí aunque el backend sí la reconocía — ahora deben coincidir exactamente.
it('esUnidadSubjetiva_detecta_tambien_los_plurales', () => {
  for (const plural of ['cucharadas', 'cucharaditas', 'tazas', 'vasos', 'pizcas']) {
    expect(esUnidadSubjetiva(plural)).toBe(true);
  }
});

it('equivalenciaMetrica_convierte_2_cucharadas_de_salsa_de_soja_a_30_ml_sin_decimales_raros', () => {
  expect(equivalenciaMetrica(2, 'cucharadas')).toBe('30 ml');
});

it('unidadDeCompra_reconoce_cucharadas_en_plural', () => {
  expect(unidadDeCompra(2, 'cucharadas')).toEqual({ cantidad: 0.03, unidad: 'l' });
});

it('etiquetaUnidad_devuelve_la_etiqueta_legible_o_la_unidad_tal_cual', () => {
  expect(etiquetaUnidad('cucharada')).toBe('Cucharada(s)');
  expect(etiquetaUnidad('kg')).toBe('kg');
});

it('equivalenciaMetrica_convierte_una_cucharada_a_15_ml', () => {
  expect(equivalenciaMetrica(1, 'cucharada')).toBe('15 ml');
});

it('unidadDeCompra_convierte_tazas_a_litros_no_a_mililitros', () => {
  expect(unidadDeCompra(4, 'taza')).toEqual({ cantidad: 1, unidad: 'l' });
});
