import { Clave } from '../../core/i18n/traducir';
import { EstadoReserva } from '../models';

const ESTADO_LABELS: Record<EstadoReserva, Clave> = {
  PENDIENTE: 'reserva.estado.PENDIENTE',
  ACEPTADA: 'reserva.estado.ACEPTADA',
  CANCELADA: 'reserva.estado.CANCELADA',
};

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
