export type EstadoReserva = 'PENDIENTE' | 'ACEPTADA' | 'CANCELADA';

/** `ReservaRequesDTO` */
export interface ReservaRequestDTO {
  cantidad: number;
  fechaReserva: string;
  horarioLlegada: string;
  idUsuario: number;
  idRestaurant: number;
}

/** `ReservaListDTO` */
export interface ReservaListDTO {
  id: number;
  cantidad: number;
  fechaReserva: string;
  horariollegada: string;
  estadoReserva: EstadoReserva;
  nombreResto: string;
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
}

/**
 * `ReservaPatchDTO`. The owner changes date, arrival time and party size of a PENDIENTE or
 * ACEPTADA reservation (it goes back to PENDIENTE), or cancels it with `estadoReserva`.
 */
export interface ReservaPatchDTO {
  cantidad?: number | null;
  fechaReserva?: string | null;
  horarioLlegada?: string | null;
  estadoReserva?: EstadoReserva | null;
}
