import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/** `RestaurantListDTO` */
export interface RestauranteListDTO {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  /** Map coordinates; null (or missing on older backends) until an admin sets the location. */
  latitud?: number | null;
  longitud?: number | null;
}

/** `RestaurantDetailDTO` */
export interface RestauranteDetailDTO {
  id: number;
  nombre: string;
  cupoMaximo: number;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
}
