import { EspecialidadDeComida } from '../../../core/auth/auth.models';

export type EstadoRestaurante = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

/** `SolicitudRestauranteDTO`: a restaurant sign-up waiting for review. */
export interface SolicitudRestaurante {
  restaurantId: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  cupoMaximo: number;
  estado: EstadoRestaurante;
  usuarioId: number;
  email: string;
  telefono: string;
  /** ISO date-time; null for accounts created before the column existed. */
  fechaRegistro: string | null;
}

/** `EntidadClienteDTO` */
export interface EntidadCliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  email: string;
  telefono: string;
  strikes: number;
  activo: boolean;
  fechaRegistro: string | null;
}

/** `EntidadRestauranteDTO` */
export interface EntidadRestaurante {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  estado: EstadoRestaurante;
  strikes: number;
  activo: boolean;
  usuarioId: number;
  email: string;
}
