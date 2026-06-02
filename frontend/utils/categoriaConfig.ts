export interface CategoriaConfig {
  icon: string;
  bg: string;
  fg: string;
}

export const CATEGORIA_CONFIG: Record<string, CategoriaConfig> = {
  'Frutas y verduras': { icon: 'leaf-outline',      bg: '#D4EDDA', fg: '#2E7D46' },
  'Carnes':            { icon: 'nutrition-outline',  bg: '#F8D7DA', fg: '#C62828' },
  'Pescados':          { icon: 'fish-outline',       bg: '#CCE5FF', fg: '#1565C0' },
  'Lácteos':           { icon: 'cafe-outline',       bg: '#FFF9C4', fg: '#F9A825' },
  'Bebidas':           { icon: 'water-outline',      bg: '#D1ECF1', fg: '#00838F' },
  'Congelados':        { icon: 'snow-outline',       bg: '#E3F2FD', fg: '#1976D2' },
  'Condimentos':       { icon: 'flask-outline',      bg: '#FFE0B2', fg: '#E65100' },
  'Cereales':          { icon: 'apps-outline',       bg: '#FFF3CD', fg: '#C79100' },
  'Conservas':         { icon: 'layers-outline',     bg: '#EDE7D9', fg: '#6D4C41' },
  'Snacks':            { icon: 'pizza-outline',      bg: '#FCE4EC', fg: '#C2185B' },
};

export const DEFAULT_CAT: CategoriaConfig = { icon: 'basket-outline', bg: '#F2F2F2', fg: '#757575' };

export function getCategoriaConfig(categoria: string | undefined): CategoriaConfig {
  if (!categoria) return DEFAULT_CAT;
  return CATEGORIA_CONFIG[categoria] ?? DEFAULT_CAT;
}
