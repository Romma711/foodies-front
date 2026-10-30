import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/** `RestaurantListDTO` */
export interface RestauranteListDTO {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
}

/** `RestaurantDetailDTO` */
/** `CartaDTO` público: `url` apunta al PDF de la carta del restaurante. */
export interface CartaPublicaDTO {
  id: number;
  nombreArchivo: string;
  url: string;
  tamanioBytes: number | null;
  actualizadaEn: string | null;
}

export interface RestauranteDetailDTO {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
}
