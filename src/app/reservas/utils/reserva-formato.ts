import { EstadoReserva } from '../models';

const ESTADO_LABELS: Record<EstadoReserva, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

export function formatearFechaReserva(value: string): string {
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) {
    return value;
  }
  const formateada = new Intl.DateTimeFormat('es-AR', {
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

export function estadoLabel(estado: EstadoReserva): string {
  return ESTADO_LABELS[estado];
}
