import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { withRole } from '../../core/auth/auth-context';
import { environment } from '../../../environments/environment';
import { EstadoRestaurante } from '../models/entidades-admin';
import { SolicitudRestaurante } from '../models/solicitud-restaurante';
import { ErrorAdmin, mensajeErrorAdmin } from './mensaje-error-admin';
import { Clave, Mensaje } from '../../core/i18n/traducir';

interface EstadoSolicitud {
  restaurantId: number;
  nombre: string;
  estado: EstadoRestaurante;
}

/** Pending restaurant sign-ups and the approve/reject actions of the admin panel. */
@Service()
export class AdminSolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/restaurantes`;

  private readonly _solicitudes = signal<SolicitudRestaurante[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<Mensaje | null>(null);

  readonly solicitudes = this._solicitudes.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  cargar(): Observable<SolicitudRestaurante[]> {
    this._cargando.set(true);
    this._error.set(null);
    return this.http
      .get<SolicitudRestaurante[] | null>(`${this.apiUrl}/pendientes`, {
        context: withRole('ADMIN'),
      })
      .pipe(
        map((solicitudes) => solicitudes ?? []),
        tap((solicitudes) => this._solicitudes.set(solicitudes)),
        catchError((error: unknown) => {
          this._error.set(mensajeErrorAdmin(error, 'admin.error.solicitudes'));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false)),
      );
  }

  /** Publishes the restaurant and gives its manager the restaurant portal. */
  aprobar(restaurantId: number): Observable<EstadoSolicitud> {
    return this.resolver(restaurantId, 'aprobar', 'admin.error.aprobar');
  }

  rechazar(restaurantId: number): Observable<EstadoSolicitud> {
    return this.resolver(restaurantId, 'rechazar', 'admin.error.rechazarSolicitud');
  }

  /** Errors come back as an `Error` whose message is ready to show to the admin. */
  private resolver(
    restaurantId: number,
    accion: 'aprobar' | 'rechazar',
    porDefecto: Clave,
  ): Observable<EstadoSolicitud> {
    return this.http
      .put<EstadoSolicitud>(`${this.apiUrl}/${restaurantId}/${accion}`, null, {
        context: withRole('ADMIN'),
      })
      .pipe(
        tap(() =>
          this._solicitudes.update((solicitudes) =>
            solicitudes.filter((solicitud) => solicitud.restaurantId !== restaurantId),
          ),
        ),
        catchError((error: unknown) =>
          throwError(() => new ErrorAdmin(mensajeErrorAdmin(error, porDefecto))),
        ),
      );
  }
}
