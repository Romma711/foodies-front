import { EspecialidadDeComida } from '../../../core/auth/auth.models';
import { iconoEspecialidad } from './marcador-especialidad';
import { crearPopupRestaurante } from './popup-restaurante';

const ESPECIALIDADES: EspecialidadDeComida[] = [
  'PARRILLA',
  'PASTAS',
  'PESCADOS',
  'ASIATICA',
  'MINUTAS',
  'CAFE',
];
const EMOJI = /\p{Extended_Pictographic}/u;

describe('iconoEspecialidad', () => {
  it.each(ESPECIALIDADES)('el pin de %s usa un ícono de línea, sin emojis', (especialidad) => {
    const html = String(iconoEspecialidad(especialidad).options.html);

    expect(html).toContain('<svg');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(EMOJI);
  });
});

describe('portada del popup', () => {
  it('muestra el ícono de la especialidad, sin emojis', () => {
    const { elemento } = crearPopupRestaurante(
      {
        id: 1,
        nombre: 'El Muelle',
        ubicacion: 'Costa 1',
        especialidad: 'PESCADOS',
        cupoMaximo: 10,
      } as Parameters<typeof crearPopupRestaurante>[0],
      () => undefined,
    );

    const portada = elemento.firstElementChild!;
    expect(portada.querySelector('svg')).not.toBeNull();
    expect(portada.textContent ?? '').not.toMatch(EMOJI);
  });
});
