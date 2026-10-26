/** Mirrors the backend `RestauranteCalificacionDTO`. */
export interface RestauranteCalificacion {
  id: number;
  nombre: string;
  promedio: number;
  cantidadResenas: number;
}

/** Mirrors the backend `RestauranteReservasDTO`. */
export interface RestauranteReservas {
  id: number;
  nombre: string;
  cantidadReservas: number;
}

/** Mirrors the backend `UsuarioResenasDTO`. */
export interface UsuarioResenas {
  id: number;
  nombre: string;
  apellido: string;
  cantidadResenas: number;
}

/** `GET /api/admin/metricas` → backend `MetricasAdminDTO`. */
export interface MetricasAdmin {
  /** ISO month, e.g. `2026-10`. */
  periodo: string;
  topRestaurantesMejorCalificados: RestauranteCalificacion[];
  topRestaurantesConMasReservas: RestauranteReservas[];
  topUsuariosConMasResenas: UsuarioResenas[];
  usuariosRegistradosEsteMes: number;
}

/** One bar of a ranking chart. */
export interface ItemRanking {
  etiqueta: string;
  valor: number;
}
