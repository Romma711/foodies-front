export interface ResenaRequestDTO {
  id?: number | null;
  comentario: string;
  calificacion: number;
  usuarioId: number;
  restaurantId: number;
}
