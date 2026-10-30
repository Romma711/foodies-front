import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/** `RestaurantListDTO` */
export interface RestauranteListDTO {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  /** Portada elegida por el restaurante; null si todavía no cargó fotos. */
  fotoPortada: string | null;
}

/** `FotoDTO` público. La portada viene primero. */
export interface FotoPublicaDTO {
  id: number;
  url: string;
  portada: boolean;
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
