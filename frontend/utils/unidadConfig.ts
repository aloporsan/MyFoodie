export const UNIDADES_OBJETIVAS = ['unidad', 'g', 'kg', 'ml', 'l', 'oz', 'lb'];
export const UNIDADES_SUBJETIVAS = ['cucharada', 'cucharadita', 'taza', 'vaso', 'pizca'];

const ETIQUETAS_UNIDAD: Record<string, string> = {
  unidad: 'Unidad(es)',
  cucharada: 'Cucharada(s)',
  cucharadita: 'Cucharadita(s)',
  taza: 'Taza(s)',
  vaso: 'Vaso(s)',
  pizca: 'Pizca(s)',
};

export function etiquetaUnidad(unidad: string): string {
  return ETIQUETAS_UNIDAD[unidad] ?? unidad;
}

const CONVERSIONES_SUBJETIVAS: Record<string, { factor: number; destino: 'ml' | 'g' }> = {
  cucharada: { factor: 15, destino: 'ml' },
  cucharadita: { factor: 5, destino: 'ml' },
  taza: { factor: 250, destino: 'ml' },
  vaso: { factor: 200, destino: 'ml' },
  pizca: { factor: 0.5, destino: 'g' },
};

export function esUnidadSubjetiva(unidad: string): boolean {
  return unidad.toLowerCase() in CONVERSIONES_SUBJETIVAS;
}

export function equivalenciaMetrica(cantidad: number, unidad: string): string | null {
  const conversion = CONVERSIONES_SUBJETIVAS[unidad.toLowerCase()];
  if (!conversion) return null;
  const base = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
  const total = Math.round(base * conversion.factor * 100) / 100;
  return `${total} ${conversion.destino}`;
}

// Convierte una unidad subjetiva a litros/kilos (lo que se compra), no a ml/g (trazabilidad interna)
export function unidadDeCompra(cantidad: number, unidad: string): { cantidad: number; unidad: 'l' | 'kg' } | null {
  const conversion = CONVERSIONES_SUBJETIVAS[unidad.toLowerCase()];
  if (!conversion) return null;
  const base = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
  const totalBase = base * conversion.factor;
  const destino = conversion.destino === 'ml' ? 'l' : 'kg';
  const cantidadDestino = Math.round((totalBase / 1000) * 100) / 100;
  return { cantidad: cantidadDestino, unidad: destino };
}
