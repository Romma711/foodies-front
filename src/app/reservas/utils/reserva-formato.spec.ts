import { traducir } from '../../core/i18n/traducir';
import { EstadoReserva } from '../models';
import { estadoLabel, momentoLlegada, puedeCambiarReserva } from './reserva-formato';

function local(fecha: Date): { fechaReserva: string; horariollegada: string } {
  const dia = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  const hora = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}:00`;
  return { fechaReserva: dia, horariollegada: hora };
}

describe('reserva-formato', () => {
  it('tiene un texto en español para cada uno de los 7 estados', () => {
    const estados: EstadoReserva[] = [
      'PENDIENTE',
      'ACEPTADA',
      'CANCELADA',
      'RECHAZADA',
      'ASISTIO',
      'NO_ASISTIO',
      'VENCIDA',
    ];
    expect(estados.map((estado) => traducir('es', estadoLabel(estado)))).toEqual([
      'Pendiente',
      'Confirmada',
      'Cancelada',
      'Rechazada',
      'Asististe',
      'No asististe',
      'Vencida',
    ]);
  });

  it('arma el momento de llegada local a partir de la fecha del API y la hora', () => {
    const llegada = momentoLlegada('2026-12-05T03:00:00.000+00:00', '21:30:00');
    expect(llegada?.getFullYear()).toBe(2026);
    expect(llegada?.getMonth()).toBe(11);
    expect(llegada?.getDate()).toBe(5);
    expect(llegada?.getHours()).toBe(21);
    expect(llegada?.getMinutes()).toBe(30);
    expect(momentoLlegada('', '21:30')).toBeNull();
  });

  describe('puedeCambiarReserva (regla D3: hasta 30 minutos antes)', () => {
    const ahora = new Date(2026, 11, 5, 20, 0, 0);

    it('permite cambiar una reserva activa a más de 30 minutos de la llegada', () => {
      const llegada = new Date(2026, 11, 5, 20, 31, 0);
      expect(puedeCambiarReserva({ estadoReserva: 'PENDIENTE', ...local(llegada) }, ahora)).toBe(
        true,
      );
      expect(puedeCambiarReserva({ estadoReserva: 'ACEPTADA', ...local(llegada) }, ahora)).toBe(
        true,
      );
    });

    it('no permite cambiar a 30 minutos o menos de la llegada', () => {
      const llegada = new Date(2026, 11, 5, 20, 30, 0);
      expect(puedeCambiarReserva({ estadoReserva: 'ACEPTADA', ...local(llegada) }, ahora)).toBe(
        false,
      );
    });

    it('no permite cambiar una reserva en un estado final', () => {
      const llegada = new Date(2026, 11, 6, 21, 0, 0);
      for (const estado of [
        'CANCELADA',
        'RECHAZADA',
        'ASISTIO',
        'NO_ASISTIO',
        'VENCIDA',
      ] as const) {
        expect(puedeCambiarReserva({ estadoReserva: estado, ...local(llegada) }, ahora)).toBe(
          false,
        );
      }
    });
  });
});
