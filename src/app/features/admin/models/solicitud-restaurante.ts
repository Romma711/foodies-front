import { Foto } from '../../../core/catalog/fotos';

/**
 * `UsuarioRestoAAprobarDTO`: un restaurante registrado que espera aprobación.
 * `id` es el del **usuario** encargado, que es lo que pide `PUT /api/admin/approved/{usuarioId}`.
 */
export interface SolicitudRestaurante {
  id: number;
  /** Nombre del restaurante. */
  nombre: string;
  email: string;
  telefono: string | null;
  /** `ROLE_PENDIENTE` mientras no se aprueba. */
  rol: string;
  fotos: Foto[];
}
