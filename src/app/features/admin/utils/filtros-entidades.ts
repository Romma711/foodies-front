import { EspecialidadDeComida } from '../../../core/auth/auth.models';
import { EntidadCliente, EntidadRestaurante, EstadoRestaurante } from '../models/entidades-admin';

/** Activos, dados de baja o todos. */
export type FiltroActivo = 'todos' | 'activos' | 'inactivos';

export interface FiltroClientes {
  /** Busca en nombre, apellido, email y teléfono. */
  texto: string;
  estado: FiltroActivo;
  /** Solo clientes con al menos un strike. */
  conStrikes: boolean;
}

export interface FiltroRestaurantes {
  /** Busca en nombre, dirección y email del encargado. */
  texto: string;
  /** '' = cualquier estado. */
  estado: EstadoRestaurante | '';
  /** '' = cualquier especialidad. */
  especialidad: EspecialidadDeComida | '';
  activo: FiltroActivo;
}

export const FILTRO_CLIENTES_VACIO: FiltroClientes = { texto: '', estado: 'todos', conStrikes: false };

export const FILTRO_RESTAURANTES_VACIO: FiltroRestaurantes = {
  texto: '',
  estado: '',
  especialidad: '',
  activo: 'todos',
};

/** Minúsculas y sin acentos, para comparar como lo escribe una persona ("gomez" encuentra "Gómez"). */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function coincideTexto(buscado: string, campos: (string | null | undefined)[]): boolean {
  const aguja = normalizar(buscado);
  return !aguja || normalizar(campos.filter(Boolean).join(' ')).includes(aguja);
}

function coincideActivo(filtro: FiltroActivo, activo: boolean): boolean {
  return filtro === 'todos' || (filtro === 'activos') === activo;
}

export function filtrarClientes(lista: readonly EntidadCliente[], filtro: FiltroClientes): EntidadCliente[] {
  return lista.filter(
    (c) =>
      coincideTexto(filtro.texto, [c.nombre, c.apellido, c.email, c.telefono]) &&
      coincideActivo(filtro.estado, c.activo) &&
      (!filtro.conStrikes || c.strikes > 0),
  );
}

export function filtrarRestaurantes(
  lista: readonly EntidadRestaurante[],
  filtro: FiltroRestaurantes,
): EntidadRestaurante[] {
  return lista.filter(
    (r) =>
      coincideTexto(filtro.texto, [r.nombre, r.ubicacion, r.email]) &&
      (!filtro.estado || r.estado === filtro.estado) &&
      (!filtro.especialidad || r.especialidad === filtro.especialidad) &&
      coincideActivo(filtro.activo, r.activo),
  );
}

export function hayFiltrosClientes(filtro: FiltroClientes): boolean {
  return filtro.texto.trim() !== '' || filtro.estado !== 'todos' || filtro.conStrikes;
}

export function hayFiltrosRestaurantes(filtro: FiltroRestaurantes): boolean {
  return (
    filtro.texto.trim() !== '' || filtro.estado !== '' || filtro.especialidad !== '' || filtro.activo !== 'todos'
  );
}
