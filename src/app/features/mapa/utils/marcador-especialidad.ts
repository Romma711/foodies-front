import { divIcon, DivIcon } from 'leaflet';
import { EspecialidadDeComida } from '../../../core/auth/auth.models';

/** Glyph shown inside each pin, one per specialty. */
export const GLIFO_ESPECIALIDAD: Record<EspecialidadDeComida, string> = {
  PARRILLA: '🥩',
  PASTAS: '🍝',
  PESCADOS: '🐟',
  ASIATICA: '🍜',
  MINUTAS: '🍔',
  CAFE: '☕',
};

/**
 * Builds the pin for a specialty. Colors live in `styles.css` under `.marcador-*`, because Leaflet
 * renders markers outside any component view.
 */
export function iconoEspecialidad(especialidad: EspecialidadDeComida): DivIcon {
  return divIcon({
    className: `marcador marcador-${especialidad.toLowerCase()}`,
    html: `<span class="marcador-glifo" aria-hidden="true">${GLIFO_ESPECIALIDAD[especialidad]}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
  });
}
