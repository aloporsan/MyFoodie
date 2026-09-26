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

// Espejo de UnidadNormalizadorService.CONVERSIONES en el backend: tiene que reconocer
// exactamente las mismas cadenas (incluidos los plurales) para que una unidad subjetiva se
// detecte igual en el cliente que en el servidor. Antes solo tenía las formas en singular, así
// que "2 cucharadas" (como las guardan el buscador de recetas y los datos de ejemplo) no se
// reconocía como subjetiva aquí, aunque el backend sí la convertía correctamente al confirmar.
const CONVERSIONES_SUBJETIVAS: Record<string, { factor: number; destino: 'ml' | 'g' }> = {
  cucharada: { factor: 15, destino: 'ml' },
  cucharadas: { factor: 15, destino: 'ml' },
  cucharadita: { factor: 5, destino: 'ml' },
  cucharaditas: { factor: 5, destino: 'ml' },
  taza: { factor: 250, destino: 'ml' },
  tazas: { factor: 250, destino: 'ml' },
  vaso: { factor: 200, destino: 'ml' },
  vasos: { factor: 200, destino: 'ml' },
  dl: { factor: 100, destino: 'ml' },
  cl: { factor: 10, destino: 'ml' },
  pizca: { factor: 0.5, destino: 'g' },
  pizcas: { factor: 0.5, destino: 'g' },
  pellizco: { factor: 1, destino: 'g' },
  kilo: { factor: 1000, destino: 'g' },
  kilogramo: { factor: 1000, destino: 'g' },
  kilogramos: { factor: 1000, destino: 'g' },
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

// Conversión entre unidades objetivas de la misma familia (peso: g/kg/oz/lb, volumen: ml/l).
// Espejo de UnidadNormalizadorService.convertirCantidad en el backend, para que el preview
// de fusión muestre el mismo resultado que calculará el servidor.
const FACTOR_A_GRAMOS: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const FACTOR_A_MILILITROS: Record<string, number> = { ml: 1, l: 1000 };

export function convertirCantidad(cantidad: number, unidadOrigen: string, unidadDestino: string): number | null {
  const origen = unidadOrigen.toLowerCase();
  const destino = unidadDestino.toLowerCase();
  if (origen === destino) return cantidad;

  if (origen in FACTOR_A_GRAMOS && destino in FACTOR_A_GRAMOS) {
    return Math.round((cantidad * FACTOR_A_GRAMOS[origen]) / FACTOR_A_GRAMOS[destino] * 100) / 100;
  }
  if (origen in FACTOR_A_MILILITROS && destino in FACTOR_A_MILILITROS) {
    return Math.round((cantidad * FACTOR_A_MILILITROS[origen]) / FACTOR_A_MILILITROS[destino] * 100) / 100;
  }
  return null;
}
