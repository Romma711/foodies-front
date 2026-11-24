import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Clave, Mensaje } from '../../core/i18n/traducir';

/** Mensaje para el usuario cuando falla un pedido del panel. No se muestran los mensajes del backend tal cual. */
export function panelErrorMessage(error: unknown, fallback: Clave): Mensaje {
  if (!(error instanceof HttpErrorResponse)) {
    return { clave: fallback };
  }
  switch (error.status) {
    case 0:
      return { clave: 'panel.error.conexion' };
    case HttpStatusCode.Unauthorized:
      return { clave: 'panel.error.sesion' };
    case HttpStatusCode.Forbidden:
      return { clave: 'panel.error.permiso' };
    case HttpStatusCode.PayloadTooLarge:
      return { clave: 'panel.error.archivoGrande' };
    default:
      return { clave: fallback };
  }
}

/**
 * Mensaje de un 400 de reglas de negocio, pensado para el encargado (por ejemplo, cuántas personas ya reservaron
 * o cuántas fotos faltan). Null si el error es de otro tipo.
 */
export function mensajeDeNegocio(error: unknown): Mensaje | null {
  if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.BadRequest) {
    const mensaje = (error.error as { mensaje?: unknown } | null)?.mensaje;
    return typeof mensaje === 'string' && mensaje.trim() ? { texto: mensaje } : null;
  }
  return null;
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

/** Fecha larga (en español por defecto), por ejemplo "Jueves, 29 de octubre de 2026". */
export function formatearDia(dia: Date, locale = 'es-AR'): string {
  const texto = new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(dia);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Fecha y hora (en español por defecto), por ejemplo "29 oct 2026, 19:45". */
export function formatearFechaHora(valor: string, locale = 'es-AR'): string {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(fecha);
}
