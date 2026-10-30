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
