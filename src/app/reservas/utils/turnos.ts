import { EspacioPublico } from '../../restaurantes/models/espacios';
import { TurnoDisponible } from '../models/disponibilidad';

/** Espacios of a shift as the espacio selector shows them: with room when `libres` fits the party. */
export function espaciosDelTurno(
  turno: TurnoDisponible | null,
  cantidad: number,
): EspacioPublico[] {
  return (turno?.espacios ?? []).map((espacio) => ({
    id: espacio.idEspacio,
    tipo: espacio.tipo,
    nombre: espacio.nombre,
    hayLugar: espacio.libres >= Math.max(cantidad, 1),
  }));
}

/** True when no espacio of the shift has room for the party. */
export function turnoLleno(turno: TurnoDisponible, cantidad: number): boolean {
  return !turno.espacios.some((espacio) => espacio.libres >= Math.max(cantidad, 1));
}

/** First shift with room for the party, as text ('' when every shift is full). */
export function turnoSugerido(turnos: readonly TurnoDisponible[], cantidad: number): string {
  const elegido = turnos.find((turno) => !turnoLleno(turno, cantidad));
  return elegido?.idTurno ? String(elegido.idTurno) : '';
}

/**
 * Shifts as the edit form shows them: the reservation being modified frees its own seats in its
 * shift and espacio, so keeping them is always possible.
 */
export function sumarReservaPropia(
  turnos: readonly TurnoDisponible[],
  idTurno: number | null,
  idEspacio: number | null,
  cantidad: number,
): TurnoDisponible[] {
  return turnos.map((turno) =>
    turno.idTurno !== null && turno.idTurno === idTurno
      ? {
          ...turno,
          espacios: turno.espacios.map((espacio) =>
            espacio.idEspacio === idEspacio
              ? { ...espacio, libres: espacio.libres + cantidad }
              : espacio,
          ),
        }
      : turno,
  );
}
