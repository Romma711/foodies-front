import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { withRole } from '../../core/auth/auth-context';
import { environment } from '../../../environments/environment';
import { ResenaModeracion } from '../models/resena-moderacion';

/** Filtros de la moderación de reseñas; los resuelve el servidor sobre todas las reseñas. */
export interface FiltroResenas {
  /** Busca en el comentario, el autor y el restaurante. */
  texto: string;
  /** Calificación exacta, de 1 a 5; null = cualquiera. */
  calificacion: number | null;
  restauranteId: number | null;
}

export const FILTRO_RESENAS_VACIO: FiltroResenas = {
  texto: '',
  calificacion: null,
  restauranteId: null,
};

/** Restaurante elegible en el filtro de la moderación. */
export interface RestauranteFiltro {
  id: number;
  nombre: string;
}

/** Reseñas por página; si llega una página completa puede haber más. */
export const RESENAS_POR_PAGINA = 20;

@Service()
export class AdminModeracionService {
  private readonly http = inject(HttpClient);

  private readonly _resenas = signal<ResenaModeracion[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _hayMas = signal(false);
  private filtro: FiltroResenas = FILTRO_RESENAS_VACIO;
  private pagina = 0;

  readonly resenas = this._resenas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  /** True cuando la última página vino completa y "Cargar más" puede traer otras. */
  readonly hayMas = this._hayMas.asReadonly();

  /** Primera página con estos filtros; reemplaza la lista. */
  cargar(filtro: FiltroResenas = FILTRO_RESENAS_VACIO): Observable<ResenaModeracion[]> {
    this.filtro = filtro;
    this.pagina = 0;
    return this.pedir(0, (resenas) => this._resenas.set(resenas));
  }

  /** Página siguiente con los mismos filtros; se agrega al final de la lista. */
  cargarMas(): Observable<ResenaModeracion[]> {
    const siguiente = this.pagina + 1;
    return this.pedir(siguiente, (resenas) => {
      this.pagina = siguiente;
      this._resenas.update((actuales) => [...actuales, ...resenas]);
    });
  }

  /** Restaurantes (por nombre) para el filtro por restaurante. */
  listarRestaurantes(): Observable<RestauranteFiltro[]> {
    return this.http
      .get<RestauranteFiltro[] | null>(`${environment.apiUrl}/admin/entidades/restaurantes`, {
        context: withRole('ADMIN'),
      })
      .pipe(
        map((lista) =>
          (lista ?? [])
            .map(({ id, nombre }) => ({ id, nombre }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        ),
      );
  }

  private pedir(
    pagina: number,
    guardar: (resenas: ResenaModeracion[]) => void,
  ): Observable<ResenaModeracion[]> {
    this._cargando.set(true);
    this._error.set(null);
    let params = new HttpParams().set('limite', RESENAS_POR_PAGINA).set('pagina', pagina);
    const texto = this.filtro.texto.trim();
    if (texto) {
      params = params.set('texto', texto);
    }
    if (this.filtro.calificacion !== null) {
      params = params.set('calificacion', this.filtro.calificacion);
    }
    if (this.filtro.restauranteId !== null) {
      params = params.set('restauranteId', this.filtro.restauranteId);
    }
    return this.http
      .get<ResenaModeracion[] | null>(`${environment.apiUrl}/admin/resenas`, {
        params,
        context: withRole('ADMIN'),
      })
      .pipe(
        map((resenas) => resenas ?? []),
        tap((resenas) => {
          guardar(resenas);
          this._hayMas.set(resenas.length === RESENAS_POR_PAGINA);
        }),
        catchError((error: unknown) => {
          this._error.set(this.mensajeError(error, 'No se pudieron cargar las reseñas.'));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false)),
      );
  }

  /**
   * Deletes through the regular reviews endpoint, which lets admins remove any review.
   * Errors come back as an `Error` whose message is ready to show to the admin.
   */
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/resenas/${id}`, { context: withRole('ADMIN') })
      .pipe(
        tap(() => this._resenas.update((resenas) => resenas.filter((resena) => resena.id !== id))),
        catchError((error: unknown) =>
          throwError(() => new Error(this.mensajeError(error, 'No se pudo eliminar la reseña.'))),
        ),
      );
  }

  private mensajeError(error: unknown, porDefecto: string): string {
    const status = error instanceof HttpErrorResponse ? error.status : -1;
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con el servidor.',
      401: 'Tu sesión venció. Iniciá sesión nuevamente.',
      403: 'Tu sesión no tiene permisos de administrador.',
      404: 'La reseña ya no existe.',
    };
    return mensajes[status] ?? porDefecto;
  }
}
