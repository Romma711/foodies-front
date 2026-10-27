import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClientePatchRequest, User } from '../models/user';

interface ApiError {
  error?: string;
  mensaje?: string;
}

@Service()
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  private readonly _cliente = signal<User | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly cliente = this._cliente.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * El backend no expone un endpoint "yo", así que buscamos el cliente por email
   * en el listado y lo exponemos como perfil de la sesión activa.
   */
  cargarPorEmail(email: string): Observable<User | undefined> {
    return this.ejecutar(
      this.http.get<User[] | null>(this.apiUrl).pipe(
        map(
          (clientes) =>
            clientes?.find((cliente) => cliente.email?.toLowerCase() === email.toLowerCase()) ??
            undefined,
        ),
        tap((cliente) => {
          this._cliente.set(cliente ?? null);
          if (!cliente) {
            this._error.set(`No encontramos ninguna cuenta asociada a ${email}.`);
          }
        }),
      ),
    );
  }

  obtenerPorId(id: number): Observable<User> {
    return this.ejecutar(
      this.http
        .get<User>(`${this.apiUrl}/${id}`)
        .pipe(tap((cliente) => this._cliente.set(cliente))),
    );
  }

  /** El backend expone PATCH /api/clientes/{id}; espera siempre nombre, apellido y teléfono. */
  actualizar(id: number, datos: ClientePatchRequest): Observable<User> {
    return this.ejecutar(
      this.http
        .patch<User>(`${this.apiUrl}/${id}`, datos)
        .pipe(tap((cliente) => this._cliente.set(cliente))),
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
      404: 'No encontramos el cliente solicitado.',
      500: 'Error interno del servidor.',
    };
    return mensajes[status] ?? 'No se pudo completar la operación.';
  }
}
