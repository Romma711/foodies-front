import { ResenaListDTO } from '../models';

export type OrdenResenas = 'recientes' | 'mejores' | 'peores';

export const OPCIONES_ORDEN: readonly { valor: OrdenResenas; etiqueta: string }[] = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'mejores', etiqueta: 'Mejor puntuación' },
  { valor: 'peores', etiqueta: 'Peor puntuación' },
];

/** Milliseconds of the review's creation date, or null when it has none or it does not parse. */
function tiempo(resena: ResenaListDTO): number | null {
  if (!resena.fechaCreacion) {
    return null;
  }
  const valor = new Date(resena.fechaCreacion).getTime();
  return Number.isNaN(valor) ? null : valor;
}

/**
 * Newer first by creation date. Old reviews were saved without one, so they go after the dated
 * ones, and the auto-increment id breaks every remaining tie.
 */
const masRecientePrimero = (a: ResenaListDTO, b: ResenaListDTO) => {
  const tiempoA = tiempo(a);
  const tiempoB = tiempo(b);
  if (tiempoA !== null && tiempoB !== null && tiempoA !== tiempoB) {
    return tiempoB - tiempoA;
  }
  if (tiempoA !== null && tiempoB === null) {
    return -1;
  }
  if (tiempoA === null && tiempoB !== null) {
    return 1;
  }
  return b.id - a.id;
};

const COMPARADORES: Record<OrdenResenas, (a: ResenaListDTO, b: ResenaListDTO) => number> = {
  recientes: masRecientePrimero,
  mejores: (a, b) => b.calificacion - a.calificacion || masRecientePrimero(a, b),
  peores: (a, b) => a.calificacion - b.calificacion || masRecientePrimero(a, b),
};

/** Filters by star count (null keeps every review) and sorts a copy, never the input. */
export function filtrarYOrdenar(
  resenas: readonly ResenaListDTO[],
  orden: OrdenResenas,
  estrellas: number | null,
): ResenaListDTO[] {
  const filtradas =
    estrellas === null
      ? [...resenas]
      : resenas.filter((resena) => resena.calificacion === estrellas);
  return filtradas.sort(COMPARADORES[orden]);
}
