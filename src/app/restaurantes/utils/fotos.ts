import { Mensaje } from '../../core/i18n/traducir';

/** Reglas de las fotos de un restaurante. El backend valida lo mismo; esto evita viajes inútiles. */
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPT_IMAGEN = TIPOS_IMAGEN.join(',');
export const MAX_FOTO_BYTES = 5 * 1024 * 1024;
export const MIN_FOTOS = 3;
export const MAX_FOTOS = 5;

/** `FotoDTO`. Exactamente una es la portada: la miniatura del catálogo. */
export interface Foto {
  id: number;
  url: string;
  portada: boolean;
}

export function errorDeImagen(archivo: File): Mensaje | null {
  if (!(TIPOS_IMAGEN as readonly string[]).includes(archivo.type)) {
    return { clave: 'fotos.error.tipo', parametros: { nombre: archivo.name } };
  }
  if (archivo.size > MAX_FOTO_BYTES) {
    return { clave: 'fotos.error.peso', parametros: { nombre: archivo.name } };
  }
  return null;
}

/** Fotos del registro: entre 3 y 5. */
export function errorDeFotosRegistro(fotos: readonly File[]): Mensaje | null {
  if (fotos.length < MIN_FOTOS) {
    return { clave: 'fotos.error.pocas', parametros: { min: MIN_FOTOS } };
  }
  if (fotos.length > MAX_FOTOS) {
    return { clave: 'fotos.error.muchas', parametros: { max: MAX_FOTOS } };
  }
  for (const archivo of fotos) {
    const error = errorDeImagen(archivo);
    if (error) {
      return error;
    }
  }
  return null;
}
