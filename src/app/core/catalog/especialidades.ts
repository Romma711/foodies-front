import { EspecialidadDeComida } from '../auth/auth.models';

export const ESPECIALIDAD_LABELS: Record<EspecialidadDeComida, string> = {
  PESCADOS: 'Pescados',
  PARRILLA: 'Parrilla',
  PASTAS: 'Pastas',
  ASIATICA: 'Asiática',
  MINUTAS: 'Minutas',
  CAFE: 'Café',
};

export function especialidadLabel(value: EspecialidadDeComida | null | undefined): string {
  return value ? ESPECIALIDAD_LABELS[value] : 'Sin especialidad';
}
