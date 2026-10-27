import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { environment } from '../../../../environments/environment';
import { ResenaModeracion } from '../models/resena-moderacion';

@Service()
export class AdminModeracionService {
  private readonly http = inject(HttpClient);

  private readonly _resenas = signal<ResenaModeracion[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly resenas = this._resenas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  cargar(limite = 20): Observable<ResenaModeracion[]> {
    this._cargando.set(true);
    this._error.set(null);
    return this.http
      .get<ResenaModeracion[] | null>(`${environment.apiUrl}/admin/resenas`, {
        params: new HttpParams().set('limite', limite),
        context: withRole('ADMIN'),
      })
      .pipe(
        map((resenas) => resenas ?? []),
        tap((resenas) => this._resenas.set(resenas)),
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
