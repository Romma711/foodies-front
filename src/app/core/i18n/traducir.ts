import { Idioma, opcionIdioma } from './idiomas';
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
export type Mensaje =
  { clave: Clave; parametros?: ParametrosTraduccion } | { texto: string } | MensajeConCodigo;

/**
 * A backend rule error with a stable `codigo` (key `errores.<CODIGO>`) and raw `params`, formatted
 * when shown so lists and states follow the current language. `texto` keeps the backend's Spanish
 * message for code that only knows plain texts.
 */
export interface MensajeConCodigo {
  codigo: Clave;
  params: Readonly<Record<string, unknown>>;
  texto: string;
}

/** Text of a stored message in `idioma`. */
export function textoDeMensaje(idioma: Idioma, mensaje: Mensaje): string {
  if ('codigo' in mensaje) {
    return traducir(idioma, mensaje.codigo, parametrosDeError(idioma, mensaje.params));
  }
  return 'texto' in mensaje ? mensaje.texto : traducir(idioma, mensaje.clave, mensaje.parametros);
}

const ESTADOS_RESERVA = new Set([
  'PENDIENTE',
  'ACEPTADA',
  'CANCELADA',
  'RECHAZADA',
  'ASISTIO',
  'NO_ASISTIO',
  'VENCIDA',
]);

/**
 * Backend error params as placeholder values in `idioma`: lists are joined naturally ("20:00, 21:30
 * and 23:00"), opening ranges `{apertura, cierre}` use `horario.franja`, and a reservation `estado`
 * uses its state label.
 */
export function parametrosDeError(
  idioma: Idioma,
  params: Readonly<Record<string, unknown>>,
): ParametrosTraduccion {
  const valores: Record<string, string | number> = {};
  for (const [nombre, valor] of Object.entries(params)) {
    valores[nombre] = valorDeParametro(idioma, nombre, valor);
  }
  return valores;
}

function valorDeParametro(idioma: Idioma, nombre: string, valor: unknown): string | number {
  if (typeof valor === 'number') {
    return valor;
  }
  if (Array.isArray(valor)) {
    const partes = valor.map((item) => String(valorDeParametro(idioma, nombre, item)));
    return new Intl.ListFormat(opcionIdioma(idioma).locale, {
      style: 'long',
      type: 'conjunction',
    }).format(partes);
  }
  if (valor !== null && typeof valor === 'object') {
    const franja = valor as { apertura?: unknown; cierre?: unknown };
    if (typeof franja.apertura === 'string' && typeof franja.cierre === 'string') {
      return traducir(idioma, 'horario.franja', {
        apertura: franja.apertura,
        cierre: franja.cierre,
      });
    }
    return JSON.stringify(valor);
  }
  const texto = String(valor ?? '');
  if (nombre === 'estado' && ESTADOS_RESERVA.has(texto)) {
    return traducir(idioma, `panel.reservas.estado.${texto}` as Clave);
  }
  return texto;
}

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
