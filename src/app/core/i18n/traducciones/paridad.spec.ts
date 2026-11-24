import { EN } from './en';
import { ES } from './es';
import { PT } from './pt';

const marcadores = (texto: string) =>
  [...texto.matchAll(/\{(\w+)\}/g)]
    .map((marcador) => marcador[1])
    .sort()
    .join();

/** Every language must define exactly the Spanish keys, each with a non-empty text. */
describe('Diccionarios de traducción', () => {
  const clavesEs = Object.keys(ES);
  const diccionarios = [
    ['en', EN],
    ['pt', PT],
  ] as const;

  for (const [nombre, diccionario] of diccionarios) {
    const textos = diccionario as Record<string, string | undefined>;
    const claves = Object.keys(diccionario);

    it(`${nombre} no tiene claves faltantes`, () => {
      expect(clavesEs.filter((clave) => !claves.includes(clave))).toEqual([]);
    });

    it(`${nombre} no tiene claves que el español no tenga`, () => {
      expect(claves.filter((clave) => !clavesEs.includes(clave))).toEqual([]);
    });

    it(`${nombre} no tiene textos vacíos`, () => {
      expect(claves.filter((clave) => !textos[clave]?.trim())).toEqual([]);
    });

    it(`${nombre} conserva los marcadores {…} de cada texto`, () => {
      const distintas = Object.entries(ES)
        .filter(([clave, texto]) => {
          const traducido = textos[clave];
          return traducido !== undefined && marcadores(traducido) !== marcadores(texto);
        })
        .map(([clave]) => clave);

      expect(distintas).toEqual([]);
    });
  }
});
