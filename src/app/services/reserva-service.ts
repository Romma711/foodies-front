import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { ReservaDetail, ReservaList, ReservaPatchRequest, ReservaRequest } from '../models/reserva';

interface ApiError {
  error?: string;
  mensaje?: string;
}

@Service()
export class ReservaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reservas`;

  private readonly _reservas = signal<ReservaDetail[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly reservas = this._reservas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * El listado del backend no trae fecha ni restaurante, así que lo enriquecemos
   * con el detalle de cada reserva. Sin reservas responde 204 (body vacío).
   */
  listarPorUsuario(usuarioId: number): Observable<ReservaDetail[]> {
    return this.ejecutar(
      this.http.get<ReservaList[] | null>(`${this.apiUrl}/usuario/${usuarioId}`).pipe(
        map((reservas) => reservas ?? []),
        switchMap((reservas) =>
          reservas.length === 0
            ? of([] as ReservaDetail[])
            : forkJoin(reservas.map((reserva) => this.obtenerPorId(reserva.id))),
        ),
        tap((detalles) => this._reservas.set(detalles)),
      ),
    );
  }

  obtenerPorId(id: number): Observable<ReservaDetail> {
    return this.http.get<ReservaDetail>(`${this.apiUrl}/${id}`);
  }

  crear(reserva: ReservaRequest): Observable<ReservaDetail> {
    return this.ejecutar(
      this.http
        .post<ReservaDetail>(this.apiUrl, reserva)
        .pipe(tap((creada) => this._reservas.update((reservas) => [...reservas, creada]))),
    );
  }

  /** El backend solo aplica los campos no nulos del PATCH, así que mandamos únicamente el estado. */
  cancelar(id: number): Observable<ReservaDetail> {
    const patch: ReservaPatchRequest = { estadoReserva: 'CANCELADA' };
    return this.ejecutar(
      this.http
        .put<ReservaDetail>(`${this.apiUrl}/${id}`, patch)
        .pipe(
          tap((cancelada) =>
            this._reservas.update((reservas) =>
              reservas.map((reserva) => (reserva.id === cancelada.id ? cancelada : reserva)),
            ),
          ),
        ),
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
      404: 'La reserva no existe.',
      500: 'Error interno del servidor.',
    };
    return mensajes[status] ?? 'No se pudo completar la operación.';
  }
}
