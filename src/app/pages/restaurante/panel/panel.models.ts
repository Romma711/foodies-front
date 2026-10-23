import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/** `CartaDTO` */
export interface Carta {
  id: number;
  nombreArchivo: string;
  url: string;
  tamanioBytes: number | null;
  actualizadaEn: string | null;
}

/** `MiRestauranteDTO`: `carta` is null until a menu is uploaded. */
export interface MiRestaurante {
  id: number;
  nombre: string;
  cupoMaximo: number;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  carta: Carta | null;
}

/** `RestaurantPatchDTO`: only the fields sent are changed. */
export type MiRestaurantePatch = Partial<
  Pick<MiRestaurante, 'nombre' | 'cupoMaximo' | 'ubicacion' | 'especialidad'>
>;

export const ESTADOS_RESERVA = ['PENDIENTE', 'ACEPTADA', 'CANCELADA'] as const;

export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

/** `ReservaPanelDTO`: `fecha` is `yyyy-MM-dd`, `horarioLlegada` is `HH:mm[:ss]`. */
export interface ReservaPanel {
  id: number;
  cantidad: number;
  fecha: string;
  horarioLlegada: string;
  estado: EstadoReserva;
  nombreCliente: string;
  telefonoCliente: string | null;
}

export const MAX_CARTA_BYTES = 10 * 1024 * 1024;
