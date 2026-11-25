import { Component, inject } from '@angular/core';
import { I18n } from '../i18n.service';
import { esIdioma, IDIOMAS } from '../idiomas';
import { TPipe } from '../t.pipe';

let siguienteId = 0;

/** Native language picker: keyboard and screen-reader friendly with no extra code. */
@Component({
  selector: 'app-selector-idioma',
  imports: [TPipe],
  template: `
    <label [attr.for]="id" class="sr-only">{{ 'idioma.etiqueta' | t }}</label>
    <span class="relative inline-flex items-center">
      <svg
        class="pointer-events-none absolute left-2.5 size-4 text-ink-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"
        />
      </svg>
      <select
        [id]="id"
        class="appearance-none rounded-full border border-line bg-white/75 py-1.5 pr-3 pl-8 text-sm font-semibold text-ink-700 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        (change)="cambiar($event)"
      >
        @for (opcion of idiomas; track opcion.codigo) {
          <option
            [value]="opcion.codigo"
            [attr.lang]="opcion.htmlLang"
            [selected]="opcion.codigo === i18n.idioma()"
          >
            {{ opcion.nombre }}
          </option>
        }
      </select>
    </span>
  `,
})
export class SelectorIdioma {
  protected readonly i18n = inject(I18n);
  protected readonly idiomas = IDIOMAS;
  protected readonly id = `selector-idioma-${siguienteId++}`;

  protected cambiar(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    if (esIdioma(valor)) {
      this.i18n.usar(valor);
    }
  }
}
