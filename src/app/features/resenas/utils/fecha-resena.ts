const FORMATO = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Formats a review's creation date in Spanish (es-AR); null when it is missing or invalid. */
export function formatearFechaResena(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const fecha = new Date(value);
  return Number.isNaN(fecha.getTime()) ? null : FORMATO.format(fecha);
}
