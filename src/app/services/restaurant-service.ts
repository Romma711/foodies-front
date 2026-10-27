import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { RestauranteDetail, RestauranteList } from '../models/restaurante';

interface ApiError {
  error?: string;
  mensaje?: string;
}

@Service()
export class RestaurantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/restaurantes`;

  private readonly _restaurantes = signal<RestauranteList[]>([]);
  private readonly _detalle = signal<RestauranteDetail | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly restaurantes = this._restaurantes.asReadonly();
  readonly detalle = this._detalle.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /** Solo trae restaurantes aprobados; sin resultados el backend responde 204 (body vacío). */
  listar(): Observable<RestauranteList[]> {
    return this.ejecutar(
      this.http.get<RestauranteList[] | null>(this.apiUrl).pipe(
        map((restaurantes) => restaurantes ?? []),
        tap((restaurantes) => this._restaurantes.set(restaurantes)),
      ),
    );
  }

  obtenerPorId(id: number): Observable<RestauranteDetail> {
    return this.ejecutar(
      this.http
        .get<RestauranteDetail>(`${this.apiUrl}/${id}`)
        .pipe(tap((restaurante) => this._detalle.set(restaurante))),
    );
  }

  private ejecutar<T>(request: Observable<T>): Observable<T> {
    this._cargando.set(true);
    this._error.set(null);
    return request.pipe(
      catchError((error: unknown) => {
        this._error.set(this.obtenerMensajeError(error));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false)),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | string | null;
      if (typeof body === 'string' && body.trim().length > 0) {
        return body;
      }
      if (body !== null && typeof body === 'object') {
        return body.mensaje ?? body.error ?? this.mensajePorEstado(error.status);
      }
      return this.mensajePorEstado(error.status);
    }
    return 'Ocurrió un error inesperado.';
  }

  private mensajePorEstado(status: number): string {
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con el servidor.',
      401: 'No estás autenticado.',
      403: 'No tenés permisos para realizar esta acción.',
      404: 'No encontramos el restaurante solicitado.',
      500: 'Error interno del servidor.',
    };
    return mensajes[status] ?? 'No se pudo completar la operación.';
  }
}
