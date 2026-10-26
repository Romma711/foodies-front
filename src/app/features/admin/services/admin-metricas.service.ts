import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { environment } from '../../../../environments/environment';
import { MetricasAdmin } from '../models/metricas-admin';

@Service()
export class AdminMetricasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/metricas`;

  private readonly _metricas = signal<MetricasAdmin | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  /** Last successful response; kept on a failed refresh so the dashboard does not go blank. */
  readonly metricas = this._metricas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  cargar(): Observable<MetricasAdmin> {
    this._cargando.set(true);
    this._error.set(null);
    return this.http.get<MetricasAdmin>(this.apiUrl, { context: withRole('ADMIN') }).pipe(
      tap((metricas) => this._metricas.set(metricas)),
      catchError((error: unknown) => {
        this._error.set(this.mensajeError(error));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false)),
    );
  }

  private mensajeError(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : -1;
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con el servidor.',
      401: 'Tu sesión venció. Iniciá sesión nuevamente.',
      403: 'Tu sesión no tiene permisos de administrador.',
    };
    return mensajes[status] ?? 'No se pudieron cargar las métricas.';
  }
}
