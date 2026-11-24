import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Clave, Mensaje, MensajeConCodigo } from '../i18n/traducir';
import { ES } from '../i18n/traducciones/es';

/**
 * Human-readable message from the backend's `GlobalExceptionHandler`, or `null` when it sent none.
 *
 * Handled exceptions answer `{ error: '<short code>', mensaje: '<text>' }`; `@Valid` failures
 * answer `{ <field>: '<text>' }`. The short `error` code is never shown on its own.
 */
export function backendMessage(error: unknown): string | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  const body: unknown = error.error;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const fields = body as Record<string, unknown>;
  if ('mensaje' in fields || 'error' in fields) {
    return nonBlank(fields['mensaje']);
  }
  return (
    Object.values(fields)
      .map(nonBlank)
      .find((message) => message !== null) ?? null
  );
}

/**
 * True when the request never reached the backend: offline, CORS, or a proxy in front of it (the
 * dev server proxy, nginx) answering 502/503/504 because the backend is down.
 */
export function isConnectionError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && UNREACHABLE_STATUSES.has(error.status);
}

const UNREACHABLE_STATUSES = new Set<number>([
  0,
  HttpStatusCode.BadGateway,
  HttpStatusCode.ServiceUnavailable,
  HttpStatusCode.GatewayTimeout,
]);

function nonBlank(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/**
 * A rule error that carries a known `codigo` (`{ error, mensaje, codigo, params }`), as a message
 * translated into the current language with its params. Null when there is no code or the front
 * has no `errores.<CODIGO>` key for it, so the caller falls back to the Spanish `mensaje`.
 */
export function mensajeConCodigo(error: unknown): MensajeConCodigo | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  const body: unknown = error.error;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }
  const { codigo, params, mensaje } = body as Record<string, unknown>;
  if (typeof codigo !== 'string' || !(`errores.${codigo}` in ES)) {
    return null;
  }
  return {
    codigo: `errores.${codigo}` as Clave,
    params:
      params !== null && typeof params === 'object' && !Array.isArray(params)
        ? (params as Record<string, unknown>)
        : {},
    texto: nonBlank(mensaje) ?? '',
  };
}

/** The backend's message for the user: translated when it has a known code, as is otherwise. */
export function mensajeDelBackend(error: unknown): Mensaje | null {
  const conCodigo = mensajeConCodigo(error);
  if (conCodigo) {
    return conCodigo;
  }
  const texto = backendMessage(error);
  return texto ? { texto } : null;
}
