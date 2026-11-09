export interface ResenaListDTO {
  id: number;
  nombreUsuario: string;
  comentario: string;
  calificacion: number;
  /** Fecha y hora de creación (ISO-8601); null en reseñas anteriores a que se guardara. */
  fecha?: string | null;
}
