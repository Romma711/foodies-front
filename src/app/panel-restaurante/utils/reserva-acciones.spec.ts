import { reserva } from '../testing/panel.testing';
import { accionesDe, faltaMarcarAsistencia } from './reserva-acciones';

describe('accionesDe (reglas D4 y D21 del panel)', () => {
  const base = reserva({ fecha: '2026-12-05', horarioLlegada: '21:00:00' });
  const antes = new Date(2026, 11, 5, 20, 59);
  const llegada = new Date(2026, 11, 5, 21, 0);
  const a48h = new Date(2026, 11, 7, 21, 0);
  const pasadas48h = new Date(2026, 11, 7, 21, 1);

  it('antes de la llegada: una pendiente se acepta, rechaza o cancela', () => {
    expect(accionesDe({ ...base, estado: 'PENDIENTE' }, antes)).toEqual([
      'ACEPTADA',
      'RECHAZADA',
      'CANCELADA',
    ]);
  });

  it('antes de la llegada: una aceptada solo se cancela (no se rechaza)', () => {
    expect(accionesDe({ ...base, estado: 'ACEPTADA' }, antes)).toEqual(['CANCELADA']);
  });

  it('desde la llegada y hasta 48 h después: una aceptada se marca asistió o no asistió', () => {
    expect(accionesDe({ ...base, estado: 'ACEPTADA' }, llegada)).toEqual(['ASISTIO', 'NO_ASISTIO']);
    expect(accionesDe({ ...base, estado: 'ACEPTADA' }, a48h)).toEqual(['ASISTIO', 'NO_ASISTIO']);
  });

  it('pasadas las 48 h ya no se marca la asistencia', () => {
    expect(accionesDe({ ...base, estado: 'ACEPTADA' }, pasadas48h)).toEqual([]);
  });

  it('una pendiente cuya llegada ya pasó no ofrece acciones (va a vencer)', () => {
    expect(accionesDe({ ...base, estado: 'PENDIENTE' }, llegada)).toEqual([]);
  });

  it('los estados finales no ofrecen acciones', () => {
    for (const estado of ['CANCELADA', 'RECHAZADA', 'ASISTIO', 'NO_ASISTIO', 'VENCIDA'] as const) {
      expect(accionesDe({ ...base, estado }, antes)).toEqual([]);
      expect(accionesDe({ ...base, estado }, llegada)).toEqual([]);
    }
  });

  it('falta marcar la asistencia solo cuando se ofrecen asistió / no asistió (S7f)', () => {
    expect(faltaMarcarAsistencia({ ...base, estado: 'ACEPTADA' }, llegada)).toBe(true);
    expect(faltaMarcarAsistencia({ ...base, estado: 'ACEPTADA' }, antes)).toBe(false);
    expect(faltaMarcarAsistencia({ ...base, estado: 'ACEPTADA' }, pasadas48h)).toBe(false);
    expect(faltaMarcarAsistencia({ ...base, estado: 'PENDIENTE' }, llegada)).toBe(false);
    expect(faltaMarcarAsistencia({ ...base, estado: 'ASISTIO' }, llegada)).toBe(false);
  });
});
