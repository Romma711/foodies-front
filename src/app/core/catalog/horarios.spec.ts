import { FranjaHoraria, diaDeFecha, franjasDelDia, horariosDelDia, textoFranjas } from './horarios';

describe('horarios de atención', () => {
  const franjas: FranjaHoraria[] = [
    { dia: 'TUESDAY', apertura: '20:00', cierre: '00:00' },
    { dia: 'SATURDAY', apertura: '20:00', cierre: '00:00' },
    { dia: 'SATURDAY', apertura: '12:00', cierre: '16:00' },
  ];
  const ofrecidos = ['12:00', '12:30', '15:30', '16:00', '19:30', '20:00', '23:00', '23:30'];

  it('obtiene el día de la semana de una fecha local yyyy-MM-dd', () => {
    expect(diaDeFecha('2026-11-14')).toBe('SATURDAY');
    expect(diaDeFecha('2026-11-16')).toBe('MONDAY');
  });

  it('ordena las franjas del día por apertura', () => {
    expect(franjasDelDia(franjas, 'SATURDAY').map((f) => f.apertura)).toEqual(['12:00', '20:00']);
    expect(franjasDelDia(franjas, 'MONDAY')).toEqual([]);
  });

  it('ofrece solo los horarios dentro de las franjas, sin incluir la hora de cierre', () => {
    expect(horariosDelDia(ofrecidos, franjas, '2026-11-14')).toEqual([
      '12:00',
      '12:30',
      '15:30',
      '20:00',
      '23:00',
      '23:30',
    ]);
    expect(horariosDelDia(ofrecidos, franjas, '2026-11-17')).toEqual(['20:00', '23:00', '23:30']);
  });

  it('un día sin franjas está cerrado y sin horario cargado no hay restricción', () => {
    expect(horariosDelDia(ofrecidos, franjas, '2026-11-16')).toEqual([]);
    expect(horariosDelDia(ofrecidos, [], '2026-11-16')).toEqual(ofrecidos);
    expect(horariosDelDia(ofrecidos, franjas, '')).toEqual(ofrecidos);
  });

  it('describe las franjas para el cliente', () => {
    expect(textoFranjas(franjasDelDia(franjas, 'SATURDAY'))).toBe('12:00 a 16:00 y 20:00 a 00:00');
    expect(textoFranjas([])).toBe('Cerrado');
  });
});
