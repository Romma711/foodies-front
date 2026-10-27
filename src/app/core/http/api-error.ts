import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

export const CONNECTION_ERROR_MESSAGE = 'No se pudo conectar con el servidor.';

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
