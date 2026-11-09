/** `ResenaUsuarioDTO`: una reseña vista desde el perfil de quien la escribió. */
export interface ResenaUsuarioDTO {
  id: number;
  comentario: string;
  calificacion: number;
  restauranteId: number;
  nombreRestaurante: string;
  /** Fecha y hora de creación (ISO-8601); null en reseñas anteriores a que se guardara. */
  fecha?: string | null;
}
