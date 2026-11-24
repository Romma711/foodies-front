import { Clave } from '../../core/i18n/traducir';
import { ESTADOS_ACTIVOS, EstadoReserva } from '../models';

const ESTADO_LABELS: Record<EstadoReserva, Clave> = {
  PENDIENTE: 'reserva.estado.PENDIENTE',
  ACEPTADA: 'reserva.estado.ACEPTADA',
  CANCELADA: 'reserva.estado.CANCELADA',
  RECHAZADA: 'reserva.estado.RECHAZADA',
  ASISTIO: 'reserva.estado.ASISTIO',
  NO_ASISTIO: 'reserva.estado.NO_ASISTIO',
  VENCIDA: 'reserva.estado.VENCIDA',
};

/** Minutes before arrival after which the client can no longer change or cancel (rule D3). */
export const MINUTOS_LIMITE_CAMBIOS = 30;

export function formatearFechaReserva(value: string, locale = 'es-AR'): string {
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) {
    return value;
  }
  const formateada = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
  return formateada.charAt(0).toUpperCase() + formateada.slice(1);
}

export function formatearHora(value: string): string {
  return value.slice(0, 5);
}

/** Translation key of a reservation status. */
export function estadoLabel(estado: EstadoReserva): Clave {
  return ESTADO_LABELS[estado];
}

/** `yyyy-MM-dd` part of the date the API returns (ISO date or date-time). */
export function soloFecha(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}

/** Local arrival moment of a reservation, or null when the date or time cannot be read. */
export function momentoLlegada(fecha: string, hora: string): Date | null {
  const dia = soloFecha(fecha);
  const hhmm = formatearHora(hora);
  if (!dia || !/^\d{2}:\d{2}$/.test(hhmm)) {
    return null;
  }
  const llegada = new Date(`${dia}T${hhmm}:00`);
  return Number.isNaN(llegada.getTime()) ? null : llegada;
}

/**
 * True while the client may still modify or cancel: the reservation is active and its arrival is
 * more than 30 minutes away. The server enforces the same rule.
 */
export function puedeCambiarReserva(
  reserva: { estadoReserva: EstadoReserva; fechaReserva: string; horariollegada: string },
  ahora: Date = new Date(),
): boolean {
  if (!ESTADOS_ACTIVOS.includes(reserva.estadoReserva)) {
    return false;
  }
  const llegada = momentoLlegada(reserva.fechaReserva, reserva.horariollegada);
  return llegada !== null && llegada.getTime() - ahora.getTime() > MINUTOS_LIMITE_CAMBIOS * 60_000;
}
