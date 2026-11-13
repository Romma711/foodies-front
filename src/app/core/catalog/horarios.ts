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

export const DIA_SEMANA_LABELS: Record<DiaSemana, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
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

function incluye(franja: FranjaHoraria, hora: string): boolean {
  return hora >= franja.apertura && (franja.cierre === '00:00' || hora < franja.cierre);
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

/** "12:00 a 16:00 y 20:00 a 00:00", o "Cerrado". */
export function textoFranjas(franjas: readonly FranjaHoraria[]): string {
  return franjas.length === 0
    ? 'Cerrado'
    : franjas.map((f) => `${f.apertura} a ${f.cierre}`).join(' y ');
}
