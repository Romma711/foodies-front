import { divIcon, DivIcon } from 'leaflet';
import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/**
 * Line icon per specialty (24x24 paths, Lucide style: stroke only, no fill), so pins and popups
 * look sober instead of using emojis.
 */
export const ICONO_ESPECIALIDAD: Record<EspecialidadDeComida, readonly string[]> = {
  // flame
  PARRILLA: [
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  ],
  // fork and knife
  PASTAS: [
    'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
    'M7 2v20',
    'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  ],
  // fish
  PESCADOS: [
    'M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z',
    'M18 12v.5',
    'M16 17.93a9.77 9.77 0 0 1 0-11.86',
    'M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33',
  ],
  // bowl
  ASIATICA: [
    'M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z',
    'M7 21h10',
    'M19.5 12 22 6',
    'M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62',
    'M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62',
    'M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62',
  ],
  // chef hat
  MINUTAS: [
    'M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z',
    'M6 17h12',
  ],
  // cup
  CAFE: [
    'M10 2v2',
    'M14 2v2',
    'M6 2v2',
    'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1',
  ],
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const ATRIBUTOS_SVG = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

/** SVG markup of a specialty icon. Paths are constants, so the string is safe to inject. */
export function svgEspecialidad(especialidad: EspecialidadDeComida, tamano: number): string {
  const atributos = Object.entries({ ...ATRIBUTOS_SVG, width: tamano, height: tamano })
    .map(([nombre, valor]) => `${nombre}="${valor}"`)
    .join(' ');
  const trazos = ICONO_ESPECIALIDAD[especialidad].map((d) => `<path d="${d}"/>`).join('');
  return `<svg xmlns="${SVG_NS}" ${atributos}>${trazos}</svg>`;
}

/** Same icon as a DOM node, for content built with the DOM API. */
export function elementoIconoEspecialidad(
  especialidad: EspecialidadDeComida,
  tamano: number,
): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [nombre, valor] of Object.entries({
    ...ATRIBUTOS_SVG,
    width: tamano,
    height: tamano,
  })) {
    svg.setAttribute(nombre, String(valor));
  }
  for (const d of ICONO_ESPECIALIDAD[especialidad]) {
    const trazo = document.createElementNS(SVG_NS, 'path');
    trazo.setAttribute('d', d);
    svg.append(trazo);
  }
  return svg;
}

/**
 * Builds the pin for a specialty. Colors live in `styles.css` under `.marcador-*`, because Leaflet
 * renders markers outside any component view.
 */
export function iconoEspecialidad(especialidad: EspecialidadDeComida): DivIcon {
  return divIcon({
    className: `marcador marcador-${especialidad.toLowerCase()}`,
    html: `<span class="marcador-glifo">${svgEspecialidad(especialidad, 18)}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
  });
}
