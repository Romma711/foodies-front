import { EstadoReserva, ReservaPanel } from '../models/panel.models';
import { parseLocalDate } from './panel-errors';

/** States the restaurant can move a reservation to from the panel. */
export type AccionReserva = Exclude<EstadoReserva, 'PENDIENTE' | 'VENCIDA'>;

/** Hours after arrival during which attendance can still be marked (rule D4). */
export const HORAS_PARA_MARCAR_ASISTENCIA = 48;

/** Local arrival moment of a panel reservation. */
export function llegadaDe(reserva: Pick<ReservaPanel, 'fecha' | 'horarioLlegada'>): Date {
  const llegada = parseLocalDate(reserva.fecha);
  const [horas, minutos] = reserva.horarioLlegada.split(':').map(Number);
  llegada.setHours(horas, minutos, 0, 0);
  return llegada;
}

/**
 * Actions the panel offers, mirroring the server rules (D4, D21): before arrival a PENDIENTE can be
 * accepted, rejected or cancelled and an ACEPTADA cancelled; from arrival up to 48 hours later an
 * ACEPTADA is marked as attended or no-show. Final states offer nothing.
 */
export function accionesDe(reserva: ReservaPanel, ahora: Date = new Date()): AccionReserva[] {
  const llegada = llegadaDe(reserva).getTime();
  const momento = ahora.getTime();
  if (momento < llegada) {
    if (reserva.estado === 'PENDIENTE') {
      return ['ACEPTADA', 'RECHAZADA', 'CANCELADA'];
    }
    return reserva.estado === 'ACEPTADA' ? ['CANCELADA'] : [];
  }
  const limite = llegada + HORAS_PARA_MARCAR_ASISTENCIA * 60 * 60 * 1000;
  return reserva.estado === 'ACEPTADA' && momento <= limite ? ['ASISTIO', 'NO_ASISTIO'] : [];
}
