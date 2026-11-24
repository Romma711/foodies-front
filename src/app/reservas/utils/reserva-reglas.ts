import { required, schema, validate } from '@angular/forms/signals';
import { clave, Traductor, traductorEspanol } from '../../core/i18n/traducir';
import { EspacioPublico } from '../../restaurantes/models/espacios';
import {
  diaDeFecha,
  FranjaHoraria,
  franjasDelDia,
  textoFranjas,
} from '../../restaurantes/utils/horarios';

/** Fields the client chooses when creating or modifying a reservation. */
export interface ReservaFormModel {
  /** Id del espacio elegido, como texto ('' mientras no se eligió). */
  idEspacio: string;
  fechaReserva: string;
  horarioLlegada: string;
  cantidad: number;
}

/** Translation keys of the schedule and capacity rules (validator messages). */
export const MENSAJE_CERRADO = clave('reserva.regla.cerrado');
export const MENSAJE_FUERA_DE_HORARIO = clave('reserva.regla.fueraDeHorario');

/** True cuando el restaurante cargó horario y ese día no atiende. */
export function diaCerrado(franjas: readonly FranjaHoraria[], fecha: string): boolean {
  return (
    franjas.length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    franjasDelDia(franjas, diaDeFecha(fecha)).length === 0
  );
}

/** "Ese día atiende de 12:00 a 16:00 y 20:00 a 00:00.", o null si no hay horario cargado. */
export function textoHorarioDelDia(
  franjas: readonly FranjaHoraria[],
  fecha: string,
  t: Traductor = traductorEspanol,
): string | null {
  if (franjas.length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }
  const delDia = franjasDelDia(franjas, diaDeFecha(fecha));
  return delDia.length ? t('reserva.regla.atiende', { franjas: textoFranjas(delDia, t) }) : null;
}

export const MENSAJE_SIN_LUGAR = clave('reserva.regla.sinLugar');

/** True cuando el espacio elegido ya informó que no hay lugar para la fecha y cantidad pedidas. */
export function espacioSinLugar(espacios: readonly EspacioPublico[], idEspacio: string): boolean {
  return espacios.some((e) => String(e.id) === idEspacio && e.hayLugar === false);
}

/** Primer espacio con lugar (o el primero, si ninguno informa lugar), para preseleccionarlo. */
export function espacioSugerido(espacios: readonly EspacioPublico[]): string {
  const elegido = espacios.find((e) => e.hayLugar !== false) ?? espacios[0];
  return elegido ? String(elegido.id) : '';
}

/** Arrival times offered by the forms: every half hour from 12:00 to 23:00. */
export const HORARIOS = Array.from({ length: 23 }, (_, index) => {
  const minutos = 12 * 60 + index * 30;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
});

/** Local `yyyy-MM-dd` date, `diasDesdeHoy` days from today. */
export function fechaLocal(diasDesdeHoy: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Validation shared by the create and modify forms; the server checks capacity. */
export const reglasReserva = schema<ReservaFormModel>((path) => {
  required(path.idEspacio, { message: clave('reserva.regla.espacio') });
  required(path.fechaReserva, { message: clave('reserva.regla.fecha') });
  validate(path.fechaReserva, ({ value }) => {
    const fecha = value();
    if (!fecha) {
      return null;
    }
    const seleccionada = new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(seleccionada.getTime())) {
      return { kind: 'fechaInvalida', message: clave('reserva.regla.fechaInvalida') };
    }
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (seleccionada < hoy) {
      return { kind: 'fechaPasada', message: clave('reserva.regla.fechaPasada') };
    }
    const limite = new Date(hoy);
    limite.setMonth(limite.getMonth() + 3);
    if (seleccionada > limite) {
      return {
        kind: 'fechaLimite',
        message: clave('reserva.regla.fechaLimite'),
      };
    }
    return null;
  });
  required(path.horarioLlegada, { message: clave('reserva.regla.horario') });
  required(path.cantidad, { message: clave('reserva.regla.cantidad') });
  validate(path.cantidad, ({ value }) => {
    const cantidad = value();
    if (cantidad === null || cantidad === undefined) {
      return null;
    }
    if (cantidad < 1) {
      return { kind: 'min', message: clave('reserva.regla.cantidadMinima') };
    }
    return null;
  });
});
