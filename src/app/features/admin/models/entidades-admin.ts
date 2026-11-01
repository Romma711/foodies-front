import { EspecialidadDeComida } from '../../../core/auth/auth.models';

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
