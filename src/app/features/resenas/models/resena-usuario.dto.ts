/** `ResenaUsuarioDTO`: una reseña vista desde el perfil de quien la escribió. */
export interface ResenaUsuarioDTO {
  id: number;
  comentario: string;
  calificacion: number;
  restauranteId: number;
  nombreRestaurante: string;
}
