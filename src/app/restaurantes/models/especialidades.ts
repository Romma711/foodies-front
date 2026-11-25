import { EspecialidadDeComida } from '../../core/auth/auth.models';
import { Clave } from '../../core/i18n/traducir';

/** Translation key of each specialty: render it with the `t` pipe or `I18n.t`. */

export const ESPECIALIDAD_LABELS: Record<EspecialidadDeComida, Clave> = {
  PESCADOS: 'especialidad.PESCADOS',
  PARRILLA: 'especialidad.PARRILLA',
  PASTAS: 'especialidad.PASTAS',
  ASIATICA: 'especialidad.ASIATICA',
  MINUTAS: 'especialidad.MINUTAS',
  CAFE: 'especialidad.CAFE',
};

export function especialidadLabel(value: EspecialidadDeComida | null | undefined): Clave {
  return value ? ESPECIALIDAD_LABELS[value] : 'especialidad.sin';
}
