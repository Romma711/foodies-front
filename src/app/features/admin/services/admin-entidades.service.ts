import { HttpClient } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, tap, throwError } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { environment } from '../../../../environments/environment';
import { EntidadCliente, EntidadRestaurante } from '../models/entidades-admin';
import { mensajeErrorAdmin } from './mensaje-error-admin';

interface EstadoActivo {
  id: number;
  nombre: string;
  activo: boolean;
}

/** Clients and restaurants for "Gestión de Entidades", with their logical delete toggle. */
@Service()
export class AdminEntidadesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  private readonly _clientes = signal<EntidadCliente[]>([]);
  private readonly _restaurantes = signal<EntidadRestaurante[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly clientes = this._clientes.asReadonly();
  readonly restaurantes = this._restaurantes.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  cargar(): Observable<void> {
    this._cargando.set(true);
    this._error.set(null);
    const contexto = { context: withRole('ADMIN') };
    return forkJoin({
      clientes: this.http.get<EntidadCliente[] | null>(
        `${this.apiUrl}/entidades/clientes`,
        contexto,
      ),
      restaurantes: this.http.get<EntidadRestaurante[] | null>(
        `${this.apiUrl}/entidades/restaurantes`,
        contexto,
      ),
    }).pipe(
      tap(({ clientes, restaurantes }) => {
        this._clientes.set(clientes ?? []);
        this._restaurantes.set(restaurantes ?? []);
      }),
      map(() => undefined),
      catchError((error: unknown) => {
        this._error.set(mensajeErrorAdmin(error, 'No se pudieron cargar las entidades.'));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false)),
    );
  }

  /** A deactivated client can no longer sign in or use the API until reactivated. */
  cambiarActivoCliente(id: number, activo: boolean): Observable<EstadoActivo> {
    return this.cambiarActivo(`usuarios/${id}/activo`, activo).pipe(
      tap((estado) =>
        this._clientes.update((clientes) =>
          clientes.map((cliente) =>
            cliente.id === id ? { ...cliente, activo: estado.activo } : cliente,
          ),
        ),
      ),
    );
  }

  /** A deactivated restaurant disappears from the public catalog until reactivated. */
  cambiarActivoRestaurante(id: number, activo: boolean): Observable<EstadoActivo> {
    return this.cambiarActivo(`restaurantes/${id}/activo`, activo).pipe(
      tap((estado) =>
        this._restaurantes.update((restaurantes) =>
          restaurantes.map((restaurante) =>
            restaurante.id === id ? { ...restaurante, activo: estado.activo } : restaurante,
          ),
        ),
      ),
    );
  }

  /** Errors come back as an `Error` whose message is ready to show to the admin. */
  private cambiarActivo(ruta: string, activo: boolean): Observable<EstadoActivo> {
    return this.http
      .patch<EstadoActivo>(`${this.apiUrl}/${ruta}`, { activo }, { context: withRole('ADMIN') })
      .pipe(
        catchError((error: unknown) =>
          throwError(
            () =>
              new Error(
                mensajeErrorAdmin(
                  error,
                  activo ? 'No se pudo reactivar.' : 'No se pudo dar de baja.',
                ),
              ),
          ),
        ),
      );
  }
}
