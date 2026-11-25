import { EspecialidadDeComida } from '../../core/auth/auth.models';
import { TipoEspacio } from '../../restaurantes/models/espacios';
import { DiaSemana } from '../../restaurantes/utils/horarios';

/** `CartaDTO` */
export interface Carta {
  id: number;
  nombreArchivo: string;
  url: string;
  tamanioBytes: number | null;
  actualizadaEn: string | null;
}

/** `MiRestauranteDTO`: `carta` es null hasta que se sube una carta. */
export interface MiRestaurante {
  id: number;
  nombre: string;
  /** Capacidad total por día: la suma de los espacios activos. Solo lectura. */
  cupoMaximo: number;
  /** Porcentaje del cupo diario que se acepta solo (0 = apagado). */
  porcentajeAutoAceptacion: number;
  ubicacion: string;
  especialidad: EspecialidadDeComida;
  carta: Carta | null;
}

/** `RestaurantPatchDTO`: solo se modifican los campos enviados. La capacidad se edita por espacio. */
export type MiRestaurantePatch = Partial<
  Pick<MiRestaurante, 'nombre' | 'porcentajeAutoAceptacion' | 'ubicacion' | 'especialidad'>
>;

/** `EspacioDTO`: salón, patio o barra del restaurante con su capacidad por día. */
export interface Espacio {
  id: number;
  tipo: TipoEspacio;
  nombre: string;
  capacidad: number;
  activo: boolean;
}

/** `EspacioRequestDTO` */
export interface EspacioRequest {
  tipo: TipoEspacio;
  nombre: string;
  capacidad: number;
}

export const MAX_NOMBRE_ESPACIO = 60;

export const ESTADOS_RESERVA = [
  'PENDIENTE',
  'ACEPTADA',
  'CANCELADA',
  'RECHAZADA',
  'ASISTIO',
  'NO_ASISTIO',
  'VENCIDA',
] as const;

export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

/** `ReservaPanelDTO`: `fecha` es `yyyy-MM-dd`, `horarioLlegada` es `HH:mm[:ss]`. */
export interface ReservaPanel {
  id: number;
  cantidad: number;
  fecha: string;
  horarioLlegada: string;
  estado: EstadoReserva;
  nombreCliente: string;
  telefonoCliente: string | null;
  /** Null solo en reservas anteriores a los espacios que todavía no se migraron. */
  idEspacio: number | null;
  espacioNombre: string | null;
  /** Null cuando el restaurante no trabaja por turnos. */
  idTurno: number | null;
}

/** `CupoEspecialDTO`: capacidad reducida de un espacio un día. `fecha` es `yyyy-MM-dd`. */
export interface CupoEspecial {
  fecha: string;
  cupo: number;
  motivo: string | null;
  /** Personas con reservas no canceladas ese día en ese espacio. */
  reservadas: number;
  idEspacio: number;
  espacioNombre: string;
}

/** `CupoEspecialRequestDTO` */
export interface CupoEspecialRequest {
  cupo: number;
  motivo: string | null;
}

export const MAX_MOTIVO_CUPO = 120;

export const MAX_CARTA_BYTES = 10 * 1024 * 1024;

/** `TurnoDTO`: shift of one weekday. `inicio` and `fin` are `HH:mm`. */
export interface Turno {
  id: number;
  dia: DiaSemana;
  inicio: string;
  fin: string;
  duracionMinutos: number;
}

/** `TurnoRequestDTO`: `duracionMinutos` defaults to 90 on the server. */
export interface TurnoRequest {
  dia: DiaSemana;
  inicio: string;
  duracionMinutos: number;
}

export const DURACION_TURNO_POR_DEFECTO = 90;
export const DURACION_TURNO_MINIMA = 15;
export const DURACION_TURNO_MAXIMA = 360;

/** Waitlist states the panel shows: the list only brings open entries. */
export type EstadoListaEsperaPanel = 'ESPERANDO' | 'NOTIFICADA';

/**
 * `EntradaListaEsperaRestauranteDTO`: one client waiting for a place. `fecha` is `yyyy-MM-dd`,
 * `horario` is `HH:mm` (the shift start when the restaurant has shifts), `creada` is a local ISO
 * date-time.
 */
export interface EntradaListaEsperaPanel {
  id: number;
  fecha: string;
  horario: string;
  idTurno: number | null;
  cantidad: number;
  estado: EstadoListaEsperaPanel;
  creada: string;
  cliente: string;
}
