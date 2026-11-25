import { Clave } from '../../core/i18n/traducir';

export type EstadoListaEspera = 'ESPERANDO' | 'NOTIFICADA' | 'VENCIDA' | 'CANCELADA';

/** `ListaEsperaRequestDTO`: `horarioLlegada` is the shift start when the restaurant has shifts. */
export interface ListaEsperaRequest {
  idRestaurant: number;
  fechaReserva: string;
  horarioLlegada: string;
  idTurno: number | null;
  cantidad: number;
}

/** `EntradaListaEsperaDTO`: `fecha` is `yyyy-MM-dd`, `horario` is `HH:mm[:ss]`. */
export interface EntradaListaEspera {
  id: number;
  idRestaurant: number;
  nombreResto: string;
  fecha: string;
  horario: string;
  idTurno: number | null;
  cantidad: number;
  estado: EstadoListaEspera;
  creada: string;
}

/** Translation keys of each waitlist state. */
export const ESTADO_LISTA_ESPERA_LABELS: Record<EstadoListaEspera, Clave> = {
  ESPERANDO: 'listaEspera.estado.ESPERANDO',
  NOTIFICADA: 'listaEspera.estado.NOTIFICADA',
  VENCIDA: 'listaEspera.estado.VENCIDA',
  CANCELADA: 'listaEspera.estado.CANCELADA',
};

/** An entry the client can still leave. */
export function entradaAbierta(entrada: EntradaListaEspera): boolean {
  return entrada.estado === 'ESPERANDO' || entrada.estado === 'NOTIFICADA';
}
