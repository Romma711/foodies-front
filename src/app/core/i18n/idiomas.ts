/** Languages the app speaks. Spanish is the source of every text and the default. */
export type Idioma = 'es' | 'en' | 'pt';

export interface OpcionIdioma {
  codigo: Idioma;
  /** Shown in its own language so a reader finds theirs whatever is selected. */
  nombre: string;
  /** BCP 47 locale for dates and numbers. */
  locale: string;
  /** Value of `<html lang>`. */
  htmlLang: string;
}

export const IDIOMA_POR_DEFECTO: Idioma = 'es';

export const IDIOMAS: readonly OpcionIdioma[] = [
  { codigo: 'es', nombre: 'Español', locale: 'es-AR', htmlLang: 'es' },
  { codigo: 'en', nombre: 'English', locale: 'en-US', htmlLang: 'en' },
  { codigo: 'pt', nombre: 'Português', locale: 'pt-BR', htmlLang: 'pt-BR' },
];

export function esIdioma(valor: unknown): valor is Idioma {
  return IDIOMAS.some((opcion) => opcion.codigo === valor);
}

export function opcionIdioma(idioma: Idioma): OpcionIdioma {
  return IDIOMAS.find((opcion) => opcion.codigo === idioma)!;
}
