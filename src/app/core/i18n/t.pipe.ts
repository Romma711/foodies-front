import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18n } from './i18n.service';
import { Clave, ParametrosTraduccion } from './traducir';

/**
 * `{{ 'header.restaurantes' | t }}` or `{{ 'reservas.personas' | t: { n: 4 } }}`.
 *
 * Impure on purpose: a pure pipe would keep the first text because its arguments never change.
 * The lookup is a map read, and reading the language signal makes the view refresh on a switch.
 */
@Pipe({ name: 't', pure: false })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(clave: Clave, parametros?: ParametrosTraduccion): string {
    return this.i18n.t(clave, parametros);
  }
}
