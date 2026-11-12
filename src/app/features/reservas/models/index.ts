export type EstadoReserva = 'PENDIENTE' | 'ACEPTADA' | 'CANCELADA';

/** `ReservaRequesDTO` */
export interface ReservaRequestDTO {
  cantidad: number;
  fechaReserva: string;
  horarioLlegada: string;
  idUsuario: number;
  idRestaurant: number;
  /** Espacio elegido (salón, patio o barra). Obligatorio. */
  idEspacio: number;
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
}

/**
 * `ReservaPatchDTO`. The owner changes date, arrival time and party size of a PENDIENTE or
 * ACEPTADA reservation (it goes back to PENDIENTE), or cancels it with `estadoReserva`.
 */
export interface ReservaPatchDTO {
  cantidad?: number | null;
  fechaReserva?: string | null;
  horarioLlegada?: string | null;
  /** Otro espacio del mismo restaurante; null o ausente mantiene el actual. */
  idEspacio?: number | null;
  estadoReserva?: EstadoReserva | null;
}
