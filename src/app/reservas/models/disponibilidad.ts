import { TipoEspacio } from '../../restaurantes/models/espacios';

/** `EspacioDisponibleDTO`: free seats of one espacio in a shift (or in the whole day). */
export interface EspacioDisponible {
  idEspacio: number;
  nombre: string;
  tipo: TipoEspacio;
  libres: number;
}

/** `TurnoDisponibleDTO`. Without shifts there is one whole-day block with null id and times. */
export interface TurnoDisponible {
  idTurno: number | null;
  /** `HH:mm` */
  inicio: string | null;
  /** `HH:mm` */
  fin: string | null;
  espacios: EspacioDisponible[];
}

/** `DisponibilidadDTO` of `GET /api/restaurantes/{id}/disponibilidad?fecha=yyyy-MM-dd`. */
export interface Disponibilidad {
  fecha: string;
  /** True when the restaurant works with shifts; past shifts of today are left out. */
  porTurnos: boolean;
  turnos: TurnoDisponible[];
}
