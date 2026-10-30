import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CartaPublicaDTO,
  FotoPublicaDTO,
  RestauranteDetailDTO,
  RestauranteListDTO,
} from '../models/restaurante.models';

@Service()
export class RestauranteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/restaurantes`;

  private readonly _restaurantes = signal<RestauranteListDTO[]>([]);
  private readonly _restaurante = signal<RestauranteDetailDTO | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly restaurantes = this._restaurantes.asReadonly();
  readonly restaurante = this._restaurante.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  limpiar(): void {
    this._restaurante.set(null);
    this._error.set(null);
  }

  listar(): Observable<RestauranteListDTO[]> {
    return this.ejecutarLectura(
      this.http.get<RestauranteListDTO[] | null>(this.apiUrl).pipe(
        map((restaurantes) => restaurantes ?? []),
        tap((restaurantes) => this._restaurantes.set(restaurantes)),
      ),
    );
  }

  obtener(id: number): Observable<RestauranteDetailDTO> {
    return this.ejecutarLectura(
      this.http
        .get<RestauranteDetailDTO>(`${this.apiUrl}/${id}`)
        .pipe(tap((restaurante) => this._restaurante.set(restaurante))),
    );
  }

  /** La carta es opcional: si el restaurante no subió una (404) o falla el pedido, devuelve null. */
  obtenerCarta(id: number): Observable<CartaPublicaDTO | null> {
    return this.http
      .get<CartaPublicaDTO>(`${this.apiUrl}/${id}/carta`)
      .pipe(catchError(() => of(null)));
  }

  /** Las fotos son opcionales en el detalle: si falla el pedido, se muestra sin galería. */
  obtenerFotos(id: number): Observable<FotoPublicaDTO[]> {
    return this.http
      .get<FotoPublicaDTO[] | null>(`${this.apiUrl}/${id}/fotos`)
      .pipe(
        map((fotos) => fotos ?? []),
        catchError(() => of([])),
      );
  }

  private ejecutarLectura<T>(request: Observable<T>): Observable<T> {
    this._loading.set(true);
    this._error.set(null);
    return request.pipe(
      catchError((error: unknown) => {
        this._error.set(this.obtenerMensajeError(error));
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor.';
      }
      if (error.status === 404) {
        return 'El restaurante no existe.';
      }
      const body = error.error as { mensaje?: unknown } | null;
      if (body && typeof body.mensaje === 'string' && body.mensaje.trim().length > 0) {
        return body.mensaje;
      }
      return 'No pudimos cargar el restaurante.';
    }
    return 'Ocurrió un error inesperado.';
  }
}
