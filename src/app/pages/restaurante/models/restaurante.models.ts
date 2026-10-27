import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/** `RestaurantListDTO` */
export interface RestauranteListDTO {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
}

/** `RestaurantDetailDTO` */
export interface RestauranteDetailDTO {
  id: number;
  nombre: string;
  cupoMaximo: number;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
}
