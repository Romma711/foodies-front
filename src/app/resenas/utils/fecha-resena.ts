const OPCIONES: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

/** Formats a review's creation date (Spanish, es-AR, by default); null when missing or invalid. */
export function formatearFechaResena(
  value: string | null | undefined,
  locale = 'es-AR',
): string | null {
  if (!value) {
    return null;
  }
  const fecha = new Date(value);
  return Number.isNaN(fecha.getTime())
    ? null
    : new Intl.DateTimeFormat(locale, OPCIONES).format(fecha);
}
