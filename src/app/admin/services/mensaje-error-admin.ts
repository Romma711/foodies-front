import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns an admin API error into a sentence to show in the panel. A 400 uses the backend's own
 * `mensaje` (business rules such as "No se puede dar de baja a un administrador").
 */
export function mensajeErrorAdmin(error: unknown, porDefecto: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return porDefecto;
  }
  const cuerpo: unknown = error.error;
  if (
    error.status === 400 &&
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    'mensaje' in cuerpo &&
    typeof cuerpo.mensaje === 'string'
  ) {
    return cuerpo.mensaje;
  }
  const mensajes: Record<number, string> = {
    0: 'No se pudo conectar con el servidor.',
    401: 'Tu sesión venció. Iniciá sesión nuevamente.',
    403: 'Tu sesión no tiene permisos de administrador.',
    404: 'El registro ya no existe.',
  };
  return mensajes[error.status] ?? porDefecto;
}
