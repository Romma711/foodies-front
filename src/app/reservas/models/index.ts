/**
 * PENDIENTE and ACEPTADA are active; the rest are final. RECHAZADA: the restaurant declined it.
 * ASISTIO / NO_ASISTIO: attendance marked by the restaurant. VENCIDA: nobody accepted it in time.
 */
export type EstadoReserva =
  'PENDIENTE' | 'ACEPTADA' | 'CANCELADA' | 'RECHAZADA' | 'ASISTIO' | 'NO_ASISTIO' | 'VENCIDA';

/** States the client can still change or cancel (until 30 minutes before arrival). */
export const ESTADOS_ACTIVOS: readonly EstadoReserva[] = ['PENDIENTE', 'ACEPTADA'];

/** `ReservaRequesDTO` */
export interface ReservaRequestDTO {
  cantidad: number;
  fechaReserva: string;
  horarioLlegada: string;
  idUsuario: number;
  idRestaurant: number;
  /** Espacio elegido (salón, patio o barra). Obligatorio. */
  idEspacio: number;
  /** Turno elegido cuando el restaurante trabaja por turnos; ausente o null sin turnos. */
  idTurno?: number | null;
}

/** `ReservaListDTO` */
export interface ReservaListDTO {
  id: number;
  cantidad: number;
  fechaReserva: string;
  horariollegada: string;
  estadoReserva: EstadoReserva;
  nombreResto: string;
  idRestaurant: number;
  /** Null solo en reservas anteriores a los espacios que todavía no se migraron. */
  idEspacio: number | null;
  espacioNombre: string | null;
  /** Null cuando el restaurante no trabaja por turnos. */
  idTurno: number | null;
}

/** `ReservaDetailDTO` */
export interface ReservaDetailDTO {
  id: number;
  cantidad: number;
  fecha: string;
  horariollegada: string;
  estadoReserva: EstadoReserva;
  nombreUsuario: string;
  nombreResto: string;
  idEspacio: number | null;
  espacioNombre: string | null;
  /** Null cuando el restaurante no trabaja por turnos. */
  idTurno: number | null;
}

/**
 * `ReservaPatchDTO`. The owner changes date, arrival time and party size of a PENDIENTE or
 * ACEPTADA reservation (it may stay ACEPTADA when auto-accept applies), or cancels it with `estadoReserva`.
 */
export interface ReservaPatchDTO {
  cantidad?: number | null;
  fechaReserva?: string | null;
  horarioLlegada?: string | null;
  /** Otro espacio del mismo restaurante; null o ausente mantiene el actual. */
  idEspacio?: number | null;
  /** Turno elegido cuando el restaurante trabaja por turnos. */
  idTurno?: number | null;
  estadoReserva?: EstadoReserva | null;
}
