import { Clave } from '../../core/i18n/traducir';

/** Tipos de espacio de un restaurante (`TipoEspacio` del backend). */
export const TIPOS_ESPACIO = ['SALON', 'PATIO', 'BARRA'] as const;

export type TipoEspacio = (typeof TIPOS_ESPACIO)[number];

/** Translation keys. */
export const TIPO_ESPACIO_LABELS: Record<TipoEspacio, Clave> = {
  SALON: 'espacio.SALON',
  PATIO: 'espacio.PATIO',
  BARRA: 'espacio.BARRA',
};

/** Plural para agrupar espacios por tipo. */
export const TIPO_ESPACIO_PLURAL: Record<TipoEspacio, Clave> = {
  SALON: 'espacio.plural.SALON',
  PATIO: 'espacio.plural.PATIO',
  BARRA: 'espacio.plural.BARRA',
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
