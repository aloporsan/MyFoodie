/** Devuelve una descripción relativa corta ("hace 5 minutos", "hace 2 días") o la fecha si es antigua. */
export function formatearFechaRelativa(fecha: string): string {
  const diffMs = Date.now() - new Date(fecha).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return 'ahora mismo';
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`;
  if (diffHoras < 24) return `hace ${diffHoras} hora${diffHoras === 1 ? '' : 's'}`;
  if (diffDias < 7) return `hace ${diffDias} día${diffDias === 1 ? '' : 's'}`;
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
