import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { withRole } from '../../core/auth/auth-context';
import { backendMessage, isConnectionError } from '../../core/http/api-error';
import { Clave, Mensaje } from '../../core/i18n/traducir';
import { EntradaListaEspera, ListaEsperaRequest } from '../models/lista-espera';

/** Waitlist of the logged-in client (rule D15): join a full shift, see the entries, leave them. */
@Service()
export class ListaEsperaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lista-espera`;

  private readonly _entradas = signal<EntradaListaEspera[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<Mensaje | null>(null);

  readonly entradas = this._entradas.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  /** Last error of a load, join or leave, ready to show. */
  readonly error = this._error.asReadonly();

  limpiarError(): void {
    this._error.set(null);
  }

  listarMias(): Observable<EntradaListaEspera[]> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .get<EntradaListaEspera[] | null>(`${this.apiUrl}/mias`, { context: withRole('CLIENTE') })
      .pipe(
        map((entradas) => entradas ?? []),
        tap((entradas) => this._entradas.set(entradas)),
        catchError((error: unknown) => this.fallar(error, 'listaEspera.error.cargar')),
        finalize(() => this._loading.set(false)),
      );
  }

  anotar(pedido: ListaEsperaRequest): Observable<EntradaListaEspera> {
    this._saving.set(true);
    this._error.set(null);
    return this.http
      .post<EntradaListaEspera>(this.apiUrl, pedido, { context: withRole('CLIENTE') })
      .pipe(
        tap((entrada) => this._entradas.update((entradas) => [entrada, ...entradas])),
        catchError((error: unknown) => this.fallar(error, 'listaEspera.error.anotar')),
        finalize(() => this._saving.set(false)),
      );
  }

  salir(id: number): Observable<void> {
    this._saving.set(true);
    this._error.set(null);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { context: withRole('CLIENTE') }).pipe(
      tap(() =>
        this._entradas.update((entradas) =>
          entradas.map((e) => (e.id === id ? { ...e, estado: 'CANCELADA' as const } : e)),
        ),
      ),
      catchError((error: unknown) => this.fallar(error, 'listaEspera.error.salir')),
      finalize(() => this._saving.set(false)),
    );
  }

  /** Shows the backend message as is (409 "there is room", 403 strikes…), or a generic one. */
  private fallar(error: unknown, generico: Clave): Observable<never> {
    const texto = backendMessage(error);
    let mensaje: Mensaje;
    if (texto) {
      mensaje = { texto };
    } else if (isConnectionError(error)) {
      mensaje = { clave: 'comun.errorConexion' };
    } else if (error instanceof HttpErrorResponse && error.status === 401) {
      mensaje = { clave: 'comun.error.noAutenticado' };
    } else {
      mensaje = { clave: generico };
    }
    this._error.set(mensaje);
    return throwError(() => error);
  }
}
