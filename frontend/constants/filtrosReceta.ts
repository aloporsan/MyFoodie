import { ETIQUETAS_SUGERIDAS } from './etiquetas';

/**
 * Filtros multidimensionales del feed y del buscador de recetas.
 * Todas las dimensiones son multi-selección; el backend combina con AND.
 */
export interface FiltrosReceta {
  categorias: string[];
  dificultades: string[];
  etiquetas: string[];
  /** Buckets de tiempo con formato "min-max" (minutos, ambos inclusive). */
  tiempos: string[];
  /** Buckets de personas con formato "min-max". */
  personas: string[];
}

export const FILTROS_RECETA_VACIOS: FiltrosReceta = {
  categorias: [],
  dificultades: [],
  etiquetas: [],
  tiempos: [],
  personas: [],
};

export const CATEGORIAS_RECETA = [
  'Desayuno',
  'Almuerzo',
  'Cena',
  'Entrante',
  'Postre',
  'Snack',
  'Bebida',
  'Otro',
] as const;

export const DIFICULTADES_RECETA = ['Fácil', 'Media', 'Difícil'] as const;

export const ETIQUETAS_RECETA = ETIQUETAS_SUGERIDAS;

export const TIEMPOS_RECETA: { label: string; value: string }[] = [
  { label: '≤ 15 min', value: '0-15' },
  { label: '15–30 min', value: '16-30' },
  { label: '30–60 min', value: '31-60' },
  { label: '> 60 min', value: '61-9999' },
];

export const PERSONAS_RECETA: { label: string; value: string }[] = [
  { label: '1', value: '1-1' },
  { label: '2', value: '2-2' },
  { label: '3–4', value: '3-4' },
  { label: '5+', value: '5-999' },
];

export function contarFiltros(f: FiltrosReceta): number {
  return (
    f.categorias.length +
    f.dificultades.length +
    f.etiquetas.length +
    f.tiempos.length +
    f.personas.length
  );
}

export function hayFiltros(f: FiltrosReceta): boolean {
  return contarFiltros(f) > 0;
}

/** Serializa los filtros a query params repetidos para axios (URLSearchParams). */
export function filtrosRecetaAQuery(f: FiltrosReceta, base?: Record<string, string | number>): URLSearchParams {
  const params = new URLSearchParams();
  if (base) {
    for (const [clave, valor] of Object.entries(base)) params.append(clave, String(valor));
  }
  f.categorias.forEach((v) => params.append('categoria', v));
  f.dificultades.forEach((v) => params.append('dificultad', v));
  f.etiquetas.forEach((v) => params.append('etiqueta', v));
  f.tiempos.forEach((v) => params.append('tiempo', v));
  f.personas.forEach((v) => params.append('personas', v));
  return params;
}

export function alternarValor(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}
