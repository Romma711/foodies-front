import { Idioma } from './idiomas';
import { EN } from './traducciones/en';
import { Clave, ES, Traducciones } from './traducciones/es';
import { PT } from './traducciones/pt';

export type { Clave } from './traducciones/es';

/** Values replacing `{name}` placeholders in a text. */
export type ParametrosTraduccion = Readonly<Record<string, string | number>>;

export const DICCIONARIOS: Readonly<Record<Idioma, Traducciones>> = { es: ES, en: EN, pt: PT };

/**
 * Text of `clave` in `idioma`, falling back to Spanish when the language lacks it and to the key
 * itself when even Spanish does (only possible with a key built at runtime).
 */
export function traducir(idioma: Idioma, clave: Clave, parametros?: ParametrosTraduccion): string {
  const texto = DICCIONARIOS[idioma][clave] ?? ES[clave] ?? clave;
  return parametros ? interpolar(texto, parametros) : texto;
}

function interpolar(texto: string, parametros: ParametrosTraduccion): string {
  return texto.replace(/\{(\w+)\}/g, (marcador, nombre: string) =>
    nombre in parametros ? String(parametros[nombre]) : marcador,
  );
}
