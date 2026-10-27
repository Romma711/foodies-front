export interface RestauranteList {
  id: number;
  nombre: string;
  ubicacion: string;
  especialidad: string;
}

export interface RestauranteDetail {
  id: number;
  nombre: string;
  cupoMaximo: number;
  ubicacion: string;
  especialidad: string;
}

const ESPECIALIDADES: Record<string, string> = {
  PESCADOS: 'Pescados',
  PARRILLA: 'Parrilla',
  PASTAS: 'Pastas',
  ASIATICA: 'Asiática',
  MINUTAS: 'Minutas',
  CAFE: 'Café',
};

/** Nombre legible de la especialidad (enum del backend). */
export function nombreEspecialidad(valor: string): string {
  return ESPECIALIDADES[valor] ?? valor.charAt(0) + valor.slice(1).toLowerCase();
}
