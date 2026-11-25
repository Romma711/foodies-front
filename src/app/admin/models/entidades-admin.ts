import { EspecialidadDeComida } from '../../core/auth/auth.models';

export type EstadoRestaurante = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

/** `EntidadClienteDTO` */
export interface EntidadCliente {
  id: number;
  nombre: string | null;
  apellido: string | null;
  email: string;
  telefono: string;
  strikes: number;
  activo: boolean;
  fechaRegistro: string | null;
}

/** `EntidadRestauranteDTO` */
export interface EntidadRestaurante {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  estado: EstadoRestaurante;
  strikes: number;
  activo: boolean;
  usuarioId: number;
  email: string;
}

export type TipoMovimientoStrike = 'SUMA' | 'QUITA';
/** `ADMIN`: added or removed by an admin; `AUSENCIAS`: added automatically after 3 no-shows. */
export type OrigenStrike = 'ADMIN' | 'AUSENCIAS';

/** One entry of a strike history (`MovimientoStrikeDTO`), newest first. `fecha` is local ISO date-time. */
export interface MovimientoStrike {
  id: number;
  fecha: string;
  tipo: TipoMovimientoStrike;
  origen: OrigenStrike;
  motivo: string;
  totalDespues: number;
}
