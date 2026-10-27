import { ResenaListDTO } from '../models';

export type OrdenResenas = 'recientes' | 'mejores' | 'peores';

export const OPCIONES_ORDEN: readonly { valor: OrdenResenas; etiqueta: string }[] = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'mejores', etiqueta: 'Mejor puntuación' },
  { valor: 'peores', etiqueta: 'Peor puntuación' },
];

/** Reviews carry no date; the auto-increment id is the only reliable "newer first" signal. */
const masRecientePrimero = (a: ResenaListDTO, b: ResenaListDTO) => b.id - a.id;

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
