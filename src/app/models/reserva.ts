export type EstadoReserva = 'PENDIENTE' | 'ACEPTADA' | 'CANCELADA';

/**
 * Lo que devuelve GET /api/reservas/usuario/{id}.
 * Ojo: el backend serializa "horariollegada" con "l" minúscula y no incluye fecha ni restaurante.
 */
export interface ReservaList {
  id: number;
  cantidad: number;
  horariollegada: string;
  estadoReserva: EstadoReserva;
}

/**
 * Detalle completo: GET/POST/PUT /api/reservas.
 * `fecha` viene como timestamp numérico de Java (o string ISO según la config de Jackson).
 */
export interface ReservaDetail {
  id: number;
  cantidad: number;
  fecha: string | number;
  horariollegada: string;
  estadoReserva: EstadoReserva;
  nombreUsuario: string;
  nombreResto: string;
}

/** Body de POST /api/reservas. Notar que acá el campo se llama "horarioLlegada" (L mayúscula) y es string. */
export interface ReservaRequest {
  cantidad: number;
  estadoReserva: EstadoReserva;
  fechaReserva: string;
  horarioLlegada: string;
  idUsuario: number;
  idRestaurant: number;
}

/** Body de PUT /api/reservas/{id}: solo aplica los campos que no vienen nulos. */
export interface ReservaPatchRequest {
  cantidad?: number | null;
  estadoReserva?: EstadoReserva | null;
}
