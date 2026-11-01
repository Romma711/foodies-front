import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { environment } from '../../../../environments/environment';
import { SolicitudRestaurante } from '../models/solicitud-restaurante';

/** Restaurantes que esperan la aprobación del admin para empezar a operar. */
@Service()
export class AdminSolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  private readonly _solicitudes = signal<SolicitudRestaurante[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly solicitudes = this._solicitudes.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /** El backend responde 204 cuando no hay pendientes: eso es una lista vacía, no un error. */
  cargar(): Observable<SolicitudRestaurante[]> {
    this._cargando.set(true);
    this._error.set(null);
    return this.http
      .get<SolicitudRestaurante[] | null>(`${this.apiUrl}/requests`, {
        context: withRole('ADMIN'),
      })
      .pipe(
        map((solicitudes) => (Array.isArray(solicitudes) ? solicitudes : [])),
        tap((solicitudes) => this._solicitudes.set(solicitudes)),
        catchError((error: unknown) => {
          this._error.set(this.mensajeError(error, 'No se pudieron cargar las solicitudes.'));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false)),
      );
  }

  /**
   * Aprueba al restaurante: el backend pasa el rol del usuario de `ROLE_PENDIENTE` a
   * `ROLE_ENCARGADO` y marca el restaurante como `aprobado`. Los errores llegan como un `Error`
   * con el mensaje listo para mostrar.
   */
  aprobar(usuarioId: number): Observable<void> {
    return this.http
      .put<unknown>(`${this.apiUrl}/approved/${usuarioId}`, null, { context: withRole('ADMIN') })
      .pipe(
        tap(() =>
          this._solicitudes.update((solicitudes) =>
            solicitudes.filter((solicitud) => solicitud.id !== usuarioId),
          ),
        ),
        map(() => undefined),
        catchError((error: unknown) =>
          throwError(
            () => new Error(this.mensajeError(error, 'No se pudo aceptar el restaurante.')),
          ),
        ),
      );
  }

  private mensajeError(error: unknown, porDefecto: string): string {
    const status = error instanceof HttpErrorResponse ? error.status : -1;
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con el servidor.',
      401: 'Tu sesión venció. Iniciá sesión nuevamente.',
      403: 'Tu sesión no tiene permisos de administrador.',
      404: 'La solicitud ya no existe.',
    };
    return mensajes[status] ?? porDefecto;
  }
}
