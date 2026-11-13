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

export function errorDeImagen(archivo: File): string | null {
  if (!(TIPOS_IMAGEN as readonly string[]).includes(archivo.type)) {
    return `"${archivo.name}" no es una imagen JPG, PNG o WebP.`;
  }
  if (archivo.size > MAX_FOTO_BYTES) {
    return `"${archivo.name}" pesa más de 5 MB.`;
  }
  return null;
}

/** Fotos del registro: entre 3 y 5. */
export function errorDeFotosRegistro(fotos: readonly File[]): string | null {
  if (fotos.length < MIN_FOTOS) {
    return `Subí al menos ${MIN_FOTOS} fotos del restaurante.`;
  }
  if (fotos.length > MAX_FOTOS) {
    return `Podés subir hasta ${MAX_FOTOS} fotos.`;
  }
  for (const archivo of fotos) {
    const error = errorDeImagen(archivo);
    if (error) {
      return error;
    }
  }
  return null;
}
