import { Idioma } from './idiomas';
import { EN } from './traducciones/en';
import { Clave, ES, Traducciones } from './traducciones/es';
import { PT } from './traducciones/pt';

export type { Clave } from './traducciones/es';

/** Values replacing `{name}` placeholders in a text. */
export type ParametrosTraduccion = Readonly<Record<string, string | number>>;

/**
 * A message to show later: a key, translated when it is shown (so a language switch re-renders it),
 * or a text that must be shown as is, such as an error message written by the backend.
 */
export type Mensaje = { clave: Clave; parametros?: ParametrosTraduccion } | { texto: string };

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

/** A `t` function: `I18n.t` in components, `traductorEspanol` as the default of pure helpers. */
export type Traductor = (clave: Clave, parametros?: ParametrosTraduccion) => string;

export const traductorEspanol: Traductor = (clave, parametros) => traducir('es', clave, parametros);

/** Identity that type-checks a key stored where only a `string` fits (validator messages). */
export function clave(valor: Clave): Clave {
  return valor;
}

const SEPARADOR_PARAMETROS = '|';

/**
 * A key plus its values packed in one `string`, for validator messages that need a value such as a
 * maximum length. The `tClave` pipe unpacks it.
 */
export function claveConParametros(valor: Clave, parametros: ParametrosTraduccion): string {
  return valor + SEPARADOR_PARAMETROS + JSON.stringify(parametros);
}

/** Inverse of `claveConParametros`; a plain key comes back without values. */
export function desempaquetarClave(texto: string): {
  clave: Clave;
  parametros?: ParametrosTraduccion;
} {
  const corte = texto.indexOf(SEPARADOR_PARAMETROS);
  if (corte < 0) {
    return { clave: texto as Clave };
  }
  return {
    clave: texto.slice(0, corte) as Clave,
    parametros: JSON.parse(texto.slice(corte + 1)) as ParametrosTraduccion,
  };
}
