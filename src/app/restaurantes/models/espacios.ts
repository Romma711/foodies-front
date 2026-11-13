/** Tipos de espacio de un restaurante (`TipoEspacio` del backend). */
export const TIPOS_ESPACIO = ['SALON', 'PATIO', 'BARRA'] as const;

export type TipoEspacio = (typeof TIPOS_ESPACIO)[number];

export const TIPO_ESPACIO_LABELS: Record<TipoEspacio, string> = {
  SALON: 'Salón',
  PATIO: 'Patio',
  BARRA: 'Barra',
};

/** Plural para agrupar espacios por tipo. */
export const TIPO_ESPACIO_PLURAL: Record<TipoEspacio, string> = {
  SALON: 'Salones',
  PATIO: 'Patios',
  BARRA: 'Barras',
};

/**
 * `EspacioPublicoDTO`: espacio donde el cliente puede reservar. No trae la capacidad.
 * `hayLugar` es null cuando no se pidió fecha y cantidad.
 */
export interface EspacioPublico {
  id: number;
  tipo: TipoEspacio;
  nombre: string;
  hayLugar: boolean | null;
}
