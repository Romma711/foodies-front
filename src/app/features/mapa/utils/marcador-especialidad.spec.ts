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

  it('dibuja la gota en un elemento interno, porque Leaflet pisa el transform del contenedor', () => {
    const html = String(iconoEspecialidad('CAFE').options.html);

    expect(html).toMatch(/^<span class="marcador-pin"><span class="marcador-glifo"><svg/);
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
        fotoPortada: null,
      },
      () => undefined,
    );

    const portada = elemento.firstElementChild!;
    expect(portada.querySelector('svg')).not.toBeNull();
    expect(portada.textContent ?? '').not.toMatch(EMOJI);
  });
});
