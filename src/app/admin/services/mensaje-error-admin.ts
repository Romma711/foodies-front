import { HttpErrorResponse } from '@angular/common/http';
import { Clave, Mensaje, traducir } from '../../core/i18n/traducir';

/**
 * Turns an admin API error into a sentence to show in the panel. A 400 uses the backend's own
 * `mensaje` (business rules such as "No se puede dar de baja a un administrador").
 */
export function mensajeErrorAdmin(error: unknown, porDefecto: Clave): Mensaje {
  if (!(error instanceof HttpErrorResponse)) {
    return { clave: porDefecto };
  }
  const cuerpo: unknown = error.error;
  if (
    error.status === 400 &&
    typeof cuerpo === 'object' &&
    cuerpo !== null &&
    'mensaje' in cuerpo &&
    typeof cuerpo.mensaje === 'string'
  ) {
    return { texto: cuerpo.mensaje };
  }
  const mensajes: Record<number, Clave> = {
    0: 'comun.errorConexion',
    401: 'perfil.error.sesion',
    403: 'admin.error.sinPermisos',
    404: 'admin.error.noExiste',
  };
  return { clave: mensajes[error.status] ?? porDefecto };
}

/**
 * Error of an admin action. `mensaje` is what the panel shows, in the current language; `message`
 * keeps the Spanish text for logs.
 */
export class ErrorAdmin extends Error {
  constructor(readonly mensaje: Mensaje) {
    super('texto' in mensaje ? mensaje.texto : traducir('es', mensaje.clave, mensaje.parametros));
  }
}

/** The message to show for an error thrown by an admin action. */
export function mensajeDeErrorAdmin(error: unknown, porDefecto: Clave): Mensaje {
  if (error instanceof ErrorAdmin) {
    return error.mensaje;
  }
  return error instanceof Error && error.message ? { texto: error.message } : { clave: porDefecto };
}
