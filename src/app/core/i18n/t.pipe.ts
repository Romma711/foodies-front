import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n } from './i18n.service';
import { Clave, Mensaje, ParametrosTraduccion } from './traducir';

/**
 * `{{ 'header.restaurantes' | t }}`, `{{ 'reservas.personas' | t: { n: 4 } }}` or
 * `{{ mensaje | t }}` for a stored `Mensaje` (a key, or a backend text shown as is).
 *
 * Impure on purpose: a pure pipe would keep the first text because its arguments never change.
 * The lookup is a map read, and reading the language signal makes the view refresh on a switch.
 */
@Pipe({ name: 't', pure: false })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(valor: Clave | Mensaje, parametros?: ParametrosTraduccion): string {
    return typeof valor === 'string' ? this.i18n.t(valor, parametros) : this.i18n.mensaje(valor);
  }
}

/**
 * Translates a key typed as a plain `string` by an API that cannot know our keys, such as the
 * `message` of a Signal Forms validator. Write those keys with `clave()` so they are still checked.
 */
@Pipe({ name: 'tClave', pure: false })
export class TClavePipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(clave: string | undefined, parametros?: ParametrosTraduccion): string {
    return clave === undefined ? '' : this.i18n.t(clave as Clave, parametros);
  }
}
