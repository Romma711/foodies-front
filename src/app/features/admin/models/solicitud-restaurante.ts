import { EspecialidadDeComida } from '../../../core/auth/auth.models';
import { Foto } from '../../../core/catalog/fotos';
import { EstadoRestaurante } from './entidades-admin';

/** `SolicitudRestauranteDTO`: a restaurant sign-up waiting for review. */
export interface SolicitudRestaurante {
  restaurantId: number;
  /** Nombre del restaurante. */
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  cupoMaximo: number;
  estado: EstadoRestaurante;
  usuarioId: number;
  email: string;
  telefono: string | null;
  /** ISO date-time; null for accounts created before the column existed. */
  fechaRegistro: string | null;
  fotos: Foto[];
}
