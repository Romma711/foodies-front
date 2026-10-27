import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ResenaDetailDTO, ResenaListDTO, ResenaPatchDTO, ResenaRequestDTO } from '../models';

interface ApiError {
  error?: string;
  mensaje?: string;
}

@Service()
export class ResenaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/resenas`;

  private readonly _resenas = signal<ResenaListDTO[]>([]);
  private readonly _resena = signal<ResenaDetailDTO | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly resenas = this._resenas.asReadonly();
  readonly resena = this._resena.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalResenas = computed(() => this._resenas().length);

  readonly promedioCalificacion = computed(() => {
    const resenas = this._resenas();
    if (resenas.length === 0) {
      return 0;
    }
    const total = resenas.reduce((suma, resena) => suma + resena.calificacion, 0);
    return Math.round((total / resenas.length) * 10) / 10;
  });

  listarPorRestaurante(restauranteId: number): Observable<ResenaListDTO[]> {
    return this.ejecutar(
      this.http
        .get<ResenaListDTO[] | null>(this.apiUrl, {
          params: new HttpParams().set('id', restauranteId),
        })
        .pipe(
          map((resenas) => resenas ?? []),
          tap((resenas) => this._resenas.set(resenas)),
        ),
    );
  }

  listarPorUsuario(usuarioId: number): Observable<ResenaListDTO[]> {
    return this.ejecutar(
      this.http.get<ResenaListDTO[] | null>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
        map((resenas) => resenas ?? []),
        tap((resenas) => this._resenas.set(resenas)),
      ),
    );
  }

  obtenerPorId(id: number): Observable<ResenaDetailDTO> {
    return this.ejecutar(
      this.http
        .get<ResenaDetailDTO>(`${this.apiUrl}/${id}`)
        .pipe(tap((resena) => this._resena.set(resena))),
    );
  }

  crear(resena: ResenaRequestDTO): Observable<ResenaDetailDTO> {
    return this.ejecutar(
      this.http.post<ResenaDetailDTO>(this.apiUrl, resena).pipe(
        tap((creada) => {
          this._resena.set(creada);
          this._resenas.update((resenas) => [
            ...resenas,
            {
              id: creada.id,
              nombreUsuario: creada.nombreUsuario,
              comentario: creada.comentario,
              calificacion: creada.calificacion,
            },
          ]);
        }),
      ),
    );
  }

  actualizar(id: number, resena: ResenaPatchDTO): Observable<ResenaDetailDTO> {
    return this.ejecutar(
      this.http
        .put<ResenaDetailDTO>(`${this.apiUrl}/${id}`, resena)
        .pipe(tap((actualizada) => this._resena.set(actualizada))),
    );
  }

  eliminar(id: number): Observable<void> {
    return this.ejecutar(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }

  private ejecutar<T>(request: Observable<T>): Observable<T> {
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
      404: 'La reseña no existe.',
      500: 'Error interno del servidor.',
    };
    return mensajes[status] ?? 'No se pudo completar la operación.';
  }
}
