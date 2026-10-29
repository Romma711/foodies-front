import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/** `CartaDTO` */
export interface Carta {
  id: number;
  nombreArchivo: string;
  url: string;
  tamanioBytes: number | null;
  actualizadaEn: string | null;
}

/** `MiRestauranteDTO`: `carta` es null hasta que se sube una carta. */
export interface MiRestaurante {
  id: number;
  nombre: string;
  cupoMaximo: number;
  /** Porcentaje del cupo diario que se acepta solo (0 = apagado). */
  porcentajeAutoAceptacion: number;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  carta: Carta | null;
}

/** `RestaurantPatchDTO`: solo se modifican los campos enviados. */
export type MiRestaurantePatch = Partial<
  Pick<
    MiRestaurante,
    'nombre' | 'cupoMaximo' | 'porcentajeAutoAceptacion' | 'ubicacion' | 'especialidad'
  >
>;

export const ESTADOS_RESERVA = ['PENDIENTE', 'ACEPTADA', 'CANCELADA'] as const;

export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

/** `ReservaPanelDTO`: `fecha` es `yyyy-MM-dd`, `horarioLlegada` es `HH:mm[:ss]`. */
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
