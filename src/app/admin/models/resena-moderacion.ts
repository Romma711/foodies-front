/** `GET /api/admin/resenas` row → backend `ResenaModeracionDTO`. */
export interface ResenaModeracion {
  id: number;
  comentario: string;
  calificacion: number;
  /** Author's full name; empty when the user never filled it in. */
  nombreUsuario: string;
  restauranteId: number;
  nombreRestaurante: string;
}
