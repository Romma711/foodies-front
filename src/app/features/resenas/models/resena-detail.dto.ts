export interface ResenaDetailDTO {
  id: number;
  comentario: string;
  calificacion: number;
  nombreUsuario: string;
  nombreRestaurant: string;
  /** Fecha y hora de creación (ISO-8601); null en reseñas anteriores a que se guardara. */
  fecha?: string | null;
}
