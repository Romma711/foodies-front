import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { environment } from '../../../../environments/environment';
import { ResenaDetailDTO, ResenaListDTO, ResenaPatchDTO, ResenaRequestDTO } from '../models';

interface ApiError {
  error?: string;
  mensaje?: string;
  [campo: string]: unknown;
}

@Service()
export class ResenaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/resenas`;

  private readonly _resenas = signal<ResenaListDTO[]>([]);
  private readonly _resena = signal<ResenaDetailDTO | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _mutationError = signal<string | null>(null);
  private readonly _misResenaIds = signal<ReadonlySet<number>>(new Set());

  readonly resenas = this._resenas.asReadonly();
  readonly resena = this._resena.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mutationError = this._mutationError.asReadonly();
  /** Ids of the reviews written by the signed-in client; the list DTO has no owner field. */
  readonly misResenaIds = this._misResenaIds.asReadonly();

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
    return this.ejecutarLectura(
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
    return this.ejecutarLectura(
      this.http
        .get<ResenaListDTO[] | null>(`${this.apiUrl}/usuario/${usuarioId}`, {
          context: withRole('CLIENTE'),
        })
        .pipe(
          map((resenas) => resenas ?? []),
          tap((resenas) => this._resenas.set(resenas)),
        ),
    );
  }

  cargarMisResenas(usuarioId: number): Observable<ReadonlySet<number>> {
    return this.http
      .get<ResenaListDTO[] | null>(`${this.apiUrl}/usuario/${usuarioId}`, {
        context: withRole('CLIENTE'),
      })
      .pipe(
        map((resenas) => new Set((resenas ?? []).map((resena) => resena.id))),
        catchError(() => of(new Set<number>())),
        tap((ids) => this._misResenaIds.set(ids)),
      );
  }

  obtenerPorId(id: number): Observable<ResenaDetailDTO> {
    return this.ejecutarLectura(
      this.http
        .get<ResenaDetailDTO>(`${this.apiUrl}/${id}`, {
          context: withRole('CLIENTE'),
        })
        .pipe(tap((resena) => this._resena.set(resena))),
    );
  }

  crear(resena: ResenaRequestDTO): Observable<ResenaDetailDTO> {
    return this.ejecutarEscritura(
      this.http
        .post<ResenaDetailDTO>(this.apiUrl, resena, {
          context: withRole('CLIENTE'),
        })
        .pipe(
          tap((creada) => {
            this._resena.set(creada);
            this._misResenaIds.update((ids) => new Set(ids).add(creada.id));
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
    return this.ejecutarEscritura(
      this.http
        .put<ResenaDetailDTO>(`${this.apiUrl}/${id}`, resena, {
          context: withRole('CLIENTE'),
        })
        .pipe(
          tap((actualizada) => {
            this._resena.set(actualizada);
            this._resenas.update((resenas) =>
              resenas.map((item) =>
                item.id === actualizada.id
                  ? {
                      id: actualizada.id,
                      nombreUsuario: actualizada.nombreUsuario,
                      comentario: actualizada.comentario,
                      calificacion: actualizada.calificacion,
                    }
                  : item,
              ),
            );
          }),
        ),
    );
  }

  eliminar(id: number): Observable<void> {
    return this.ejecutarEscritura(
      this.http.delete<void>(`${this.apiUrl}/${id}`, {
        context: withRole('CLIENTE'),
      }),
    ).pipe(
      tap(() => {
        this._resenas.update((resenas) => resenas.filter((resena) => resena.id !== id));
        this._misResenaIds.update((ids) => new Set([...ids].filter((propio) => propio !== id)));
      }),
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

  private ejecutarEscritura<T>(request: Observable<T>): Observable<T> {
    this._saving.set(true);
    this._mutationError.set(null);
    return request.pipe(
      catchError((error: unknown) => {
        this._mutationError.set(this.obtenerMensajeError(error));
        return throwError(() => error);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | string | null;
      if (typeof body === 'string' && body.trim().length > 0) {
        return body;
      }
      if (body !== null && typeof body === 'object') {
        if (typeof body.mensaje === 'string' && body.mensaje.trim().length > 0) {
          return body.mensaje;
        }
        if (typeof body.error === 'string' && body.error.trim().length > 0) {
          return body.error;
        }
        const mensajes = Object.values(body).filter(
          (valor): valor is string => typeof valor === 'string' && valor.trim().length > 0,
        );
        if (mensajes.length > 0) {
          return mensajes.join(' ');
        }
      }
      return this.mensajePorEstado(error.status);
    }
    return 'Ocurrió un error inesperado.';
  }

  private mensajePorEstado(status: number): string {
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con el servidor.',
      400: 'Revisá los datos ingresados e intentá nuevamente.',
      401: 'No estás autenticado. Iniciá sesión para continuar.',
      403: 'No tenés permisos para realizar esta acción.',
      404: 'La reseña no existe.',
      409: 'Ya existe una reseña con esos datos.',
      500: 'Error interno del servidor.',
    };
    return mensajes[status] ?? 'No se pudo completar la operación.';
  }
}
