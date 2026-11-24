/**
 * Spanish texts: the source and the fallback of every other language. Keys are grouped by the
 * feature folder that uses them (`<area>.<screen>.<text>`); `{name}` marks a value filled in at
 * runtime. Adding a key here without adding it to `en.ts` and `pt.ts` fails the parity test.
 */
export const ES = {
  // Language selector
  'idioma.etiqueta': 'Idioma',
};

export type Clave = keyof typeof ES;

/** A language other than Spanish may lack a key: it falls back to Spanish at runtime. */
export type Traducciones = Partial<Record<Clave, string>>;
