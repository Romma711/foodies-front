import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { Clave, Mensaje } from '../../core/i18n/traducir';
import { withRole } from '../../core/auth/auth-context';
import { environment } from '../../../environments/environment';
import { ReservaDetailDTO, ReservaListDTO, ReservaPatchDTO, ReservaRequestDTO } from '../models';

interface ApiError {
  error?: string;
  mensaje?: string;
  [campo: string]: unknown;
}

@Service()
export class ReservaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reservas`;

  private readonly _reservas = signal<ReservaListDTO[]>([]);
  private readonly _reserva = signal<ReservaDetailDTO | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<Mensaje | null>(null);
  private readonly _mutationError = signal<Mensaje | null>(null);

  readonly reservas = this._reservas.asReadonly();
  readonly reserva = this._reserva.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly mutationError = this._mutationError.asReadonly();

  readonly totalReservas = computed(() => this._reservas().length);
  readonly reservasActivas = computed(
    () => this._reservas().filter((reserva) => reserva.estadoReserva !== 'CANCELADA').length,
  );

  limpiarErrorMutacion(): void {
    this._mutationError.set(null);
  }

  listarPorUsuario(usuarioId: number): Observable<ReservaListDTO[]> {
    return this.ejecutarLectura(
      this.http
        .get<ReservaListDTO[] | null>(`${this.apiUrl}/usuario/${usuarioId}`, {
          context: withRole('CLIENTE'),
        })
        .pipe(
          map((reservas) => reservas ?? []),
          tap((reservas) => this._reservas.set(reservas)),
        ),
    );
  }

  crear(reserva: ReservaRequestDTO): Observable<ReservaDetailDTO> {
    return this.ejecutarEscritura(
      this.http
        .post<ReservaDetailDTO>(this.apiUrl, reserva, {
          context: withRole('CLIENTE'),
        })
        .pipe(
          tap((creada) => {
            this._reserva.set(creada);
            this._reservas.update((reservas) => [
              {
                id: creada.id,
                cantidad: creada.cantidad,
                fechaReserva: creada.fecha,
                horariollegada: creada.horariollegada,
                estadoReserva: creada.estadoReserva,
                nombreResto: creada.nombreResto,
                idRestaurant: reserva.idRestaurant,
                idEspacio: creada.idEspacio,
                espacioNombre: creada.espacioNombre,
              },
              ...reservas,
            ]);
          }),
        ),
    );
  }

  cancelar(id: number): Observable<ReservaDetailDTO> {
    const patch: ReservaPatchDTO = { estadoReserva: 'CANCELADA' };
    return this.ejecutarEscritura(
      this.http
        .put<ReservaDetailDTO>(`${this.apiUrl}/${id}`, patch, {
          context: withRole('CLIENTE'),
        })
        .pipe(
          tap((actualizada) => {
            this._reserva.set(actualizada);
            this._reservas.update((reservas) =>
              reservas.map((reserva) =>
                reserva.id === actualizada.id
                  ? { ...reserva, estadoReserva: actualizada.estadoReserva }
                  : reserva,
              ),
            );
          }),
        ),
    );
  }

  /** Changes date, arrival time, party size and espacio; the server returns it as PENDIENTE again. */
  modificar(
    id: number,
    cambios: Required<
      Pick<ReservaPatchDTO, 'fechaReserva' | 'horarioLlegada' | 'cantidad' | 'idEspacio'>
    >,
  ): Observable<ReservaDetailDTO> {
    const patch: ReservaPatchDTO = {
      fechaReserva: cambios.fechaReserva,
      horarioLlegada: cambios.horarioLlegada,
      cantidad: cambios.cantidad,
      idEspacio: cambios.idEspacio,
    };
    return this.ejecutarEscritura(
      this.http
        .put<ReservaDetailDTO>(`${this.apiUrl}/${id}`, patch, {
          context: withRole('CLIENTE'),
        })
        .pipe(
          tap((actualizada) => {
            this._reserva.set(actualizada);
            this._reservas.update((reservas) =>
              reservas.map((reserva) =>
                reserva.id === actualizada.id
                  ? {
                      ...reserva,
                      cantidad: actualizada.cantidad,
                      fechaReserva: actualizada.fecha,
                      horariollegada: actualizada.horariollegada,
                      estadoReserva: actualizada.estadoReserva,
                      idEspacio: actualizada.idEspacio,
                      espacioNombre: actualizada.espacioNombre,
                    }
                  : reserva,
              ),
            );
          }),
        ),
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

  private obtenerMensajeError(error: unknown): Mensaje {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | string | null;
      if (typeof body === 'string' && body.trim().length > 0) {
        return { texto: body };
      }
      if (body !== null && typeof body === 'object') {
        if (typeof body.mensaje === 'string' && body.mensaje.trim().length > 0) {
          return { texto: body.mensaje };
        }
        if (typeof body.error === 'string' && body.error.trim().length > 0) {
          return { texto: body.error };
        }
        const mensajes = Object.values(body).filter(
          (valor): valor is string => typeof valor === 'string' && valor.trim().length > 0,
        );
        if (mensajes.length > 0) {
          return { texto: mensajes.join(' ') };
        }
      }
      return this.mensajePorEstado(error.status);
    }
    return { clave: 'comun.errorInesperado' };
  }

  private mensajePorEstado(status: number): Mensaje {
    const mensajes: Record<number, Clave> = {
      0: 'comun.errorConexion',
      400: 'reserva.error.datos',
      401: 'comun.error.noAutenticado',
      403: 'comun.error.sinPermisos',
      404: 'reserva.error.noExiste',
      500: 'comun.error.servidor',
    };
    return { clave: mensajes[status] ?? 'comun.error.operacion' };
  }
}
