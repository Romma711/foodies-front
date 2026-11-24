import { Clave, Traductor, traductorEspanol } from '../../core/i18n/traducir';

/** Días de la semana como los nombra el backend (`java.time.DayOfWeek`), de lunes a domingo. */
export const DIAS_SEMANA = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

/** Translation keys. */
export const DIA_SEMANA_LABELS: Record<DiaSemana, Clave> = {
  MONDAY: 'dia.MONDAY',
  TUESDAY: 'dia.TUESDAY',
  WEDNESDAY: 'dia.WEDNESDAY',
  THURSDAY: 'dia.THURSDAY',
  FRIDAY: 'dia.FRIDAY',
  SATURDAY: 'dia.SATURDAY',
  SUNDAY: 'dia.SUNDAY',
};

/** `FranjaHorariaDTO`: horas `HH:mm`; un cierre `00:00` es medianoche. */
export interface FranjaHoraria {
  dia: DiaSemana;
  apertura: string;
  cierre: string;
}

export const MAX_FRANJAS_POR_DIA = 3;

/** Día de la semana de una fecha local `yyyy-MM-dd`. */
export function diaDeFecha(fecha: string): DiaSemana {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  // getDay(): 0 = domingo … 6 = sábado.
  return DIAS_SEMANA[(new Date(anio, mes - 1, dia).getDay() + 6) % 7];
}

export function franjasDelDia(franjas: readonly FranjaHoraria[], dia: DiaSemana): FranjaHoraria[] {
  return franjas.filter((f) => f.dia === dia).sort((a, b) => a.apertura.localeCompare(b.apertura));
}

/** Minutes before closing of the latest arrival the restaurant accepts (rule D11). */
export const MINUTOS_ULTIMA_LLEGADA = 60;

function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** True when `hora` is a valid arrival: inside the range and at least 60 minutes before closing. */
function incluye(franja: FranjaHoraria, hora: string): boolean {
  const cierre = franja.cierre === '00:00' ? 24 * 60 : aMinutos(franja.cierre);
  return hora >= franja.apertura && aMinutos(hora) <= cierre - MINUTOS_ULTIMA_LLEGADA;
}

/**
 * Horarios de llegada que se pueden ofrecer ese día. Sin horario cargado (o sin fecha) no hay
 * restricción; un día sin franjas devuelve una lista vacía (cerrado).
 */
export function horariosDelDia(
  ofrecidos: readonly string[],
  franjas: readonly FranjaHoraria[],
  fecha: string,
): string[] {
  if (franjas.length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return [...ofrecidos];
  }
  const delDia = franjasDelDia(franjas, diaDeFecha(fecha));
  return ofrecidos.filter((hora) => delDia.some((franja) => incluye(franja, hora)));
}

/** "12:00 a 16:00 y 20:00 a 00:00", o "Cerrado" (in the language of `t`, Spanish by default). */
export function textoFranjas(
  franjas: readonly FranjaHoraria[],
  t: Traductor = traductorEspanol,
): string {
  return franjas.length === 0
    ? t('horario.cerrado')
    : franjas
        .map((f) => t('horario.franja', { apertura: f.apertura, cierre: f.cierre }))
        .join(t('horario.separador'));
}
