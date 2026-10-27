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

/** `ReservaPatchDTO` */
export interface ReservaPatchDTO {
  cantidad?: number | null;
  estadoReserva?: EstadoReserva | null;
}
