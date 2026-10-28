import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { environment } from '../../../../environments/environment';
import { EstadoRestaurante, SolicitudRestaurante } from '../models/entidades-admin';
import { mensajeErrorAdmin } from './mensaje-error-admin';

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
  private readonly _error = signal<string | null>(null);

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
          this._error.set(mensajeErrorAdmin(error, 'No se pudieron cargar las solicitudes.'));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false)),
      );
  }

  /** Publishes the restaurant and gives its manager the restaurant portal. */
  aprobar(restaurantId: number): Observable<EstadoSolicitud> {
    return this.resolver(restaurantId, 'aprobar', 'No se pudo aprobar la solicitud.');
  }

  rechazar(restaurantId: number): Observable<EstadoSolicitud> {
    return this.resolver(restaurantId, 'rechazar', 'No se pudo rechazar la solicitud.');
  }

  /** Errors come back as an `Error` whose message is ready to show to the admin. */
  private resolver(
    restaurantId: number,
    accion: 'aprobar' | 'rechazar',
    porDefecto: string,
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
          throwError(() => new Error(mensajeErrorAdmin(error, porDefecto))),
        ),
      );
  }
}
