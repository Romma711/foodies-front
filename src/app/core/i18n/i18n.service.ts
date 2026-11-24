import { DOCUMENT } from '@angular/common';
import { computed, inject, Service, signal } from '@angular/core';
import { esIdioma, Idioma, IDIOMA_POR_DEFECTO, opcionIdioma } from './idiomas';
import { Clave, ParametrosTraduccion, traducir } from './traducir';

const CLAVE_STORAGE = 'foodies.idioma';

/**
 * Current language of the app. Switching it re-renders every text read through `t()` or the `t`
 * pipe without reloading, remembers the choice and updates `<html lang>`.
 */
@Service()
export class I18n {
  private readonly documento = inject(DOCUMENT);
  private readonly _idioma = signal<Idioma>(leerGuardado());

  readonly idioma = this._idioma.asReadonly();
  /** BCP 47 locale of the current language, for `Intl` dates and numbers. */
  readonly locale = computed(() => opcionIdioma(this._idioma()).locale);

  constructor() {
    this.aplicarLang(this._idioma());
  }

  usar(idioma: Idioma): void {
    this._idioma.set(idioma);
    this.aplicarLang(idioma);
    try {
      localStorage.setItem(CLAVE_STORAGE, idioma);
    } catch {
      // Storage unavailable (private mode, blocked site data): the choice lasts this visit only.
    }
  }

  /** Text of `clave` in the current language; reading it inside a template or `computed` tracks it. */
  t(clave: Clave, parametros?: ParametrosTraduccion): string {
    return traducir(this._idioma(), clave, parametros);
  }

  /** Formats a date in the current language. */
  fecha(valor: Date | number, opciones: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.locale(), opciones).format(valor);
  }

  /** Formats a number in the current language. */
  numero(valor: number, opciones?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.locale(), opciones).format(valor);
  }

  private aplicarLang(idioma: Idioma): void {
    this.documento.documentElement.lang = opcionIdioma(idioma).htmlLang;
  }
}

function leerGuardado(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    return esIdioma(guardado) ? guardado : IDIOMA_POR_DEFECTO;
  } catch {
    return IDIOMA_POR_DEFECTO;
  }
}
