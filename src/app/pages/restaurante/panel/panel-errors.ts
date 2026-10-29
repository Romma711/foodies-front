import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

/** Mensaje para el usuario cuando falla un pedido del panel. No se muestran los mensajes del backend tal cual. */
export function panelErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  switch (error.status) {
    case 0:
      return 'No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.';
    case HttpStatusCode.Unauthorized:
      return 'Tu sesión expiró. Iniciá sesión de nuevo.';
    case HttpStatusCode.Forbidden:
      return 'No tenés permiso para modificar esto.';
    case HttpStatusCode.PayloadTooLarge:
      return 'El archivo pesa más de 10 MB.';
    default:
      return fallback;
  }
}

/** Las fechas de reserva llegan como `yyyy-MM-dd`; se leen como fecha local, no como medianoche UTC. */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Fecha larga en español, por ejemplo "Jueves, 29 de octubre de 2026". */
export function formatearDia(dia: Date): string {
  const texto = new Intl.DateTimeFormat('es-AR', { dateStyle: 'full' }).format(dia);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Fecha y hora en español, por ejemplo "29 oct 2026, 19:45". */
export function formatearFechaHora(valor: string): string {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    fecha,
  );
}
