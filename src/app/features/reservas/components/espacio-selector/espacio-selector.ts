import { Component, input, model } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { EspacioPublico, TIPO_ESPACIO_LABELS } from '../../../../restaurantes/models/espacios';

/**
 * Elección del espacio (salón, patio, barra) de una reserva. Se usa con `[formField]`: el valor es
 * el id del espacio como texto. No muestra capacidades, solo si hay lugar para la fecha y cantidad.
 */
@Component({
  selector: 'app-espacio-selector',
  template: `
    <fieldset [attr.aria-describedby]="errors().length && touched() ? idBase() + '-error' : null">
      <legend class="text-sm font-bold text-ink-900">Espacio</legend>
      @if (cargando()) {
        <p class="mt-2 text-sm text-ink-500" role="status">Buscando espacios…</p>
      } @else if (espacios().length === 0) {
        <p class="mt-2 text-sm text-ink-500">Este restaurante todavía no tiene espacios para reservar.</p>
      } @else {
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          @for (espacio of espacios(); track espacio.id) {
            <label
              class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition has-checked:border-brand-500 has-checked:bg-brand-500/10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-700"
              [class.border-line]="value() !== '' + espacio.id"
              [class.opacity-70]="espacio.hayLugar === false"
            >
              <input
                type="radio"
                class="size-4 accent-ink-900"
                [name]="idBase()"
                [value]="espacio.id"
                [checked]="value() === '' + espacio.id"
                (change)="elegir(espacio)"
                (blur)="touched.set(true)"
              />
              <span class="flex flex-col">
                <span class="font-semibold text-ink-900">{{ espacio.nombre }}</span>
                <span class="text-xs text-ink-500">
                  {{ tipos[espacio.tipo] }}
                  @if (espacio.hayLugar === false) {
                    · Sin lugar para esa fecha y cantidad
                  }
                </span>
              </span>
            </label>
          }
        </div>
      }
      @if (touched() && errors()[0]; as error) {
        <p [id]="idBase() + '-error'" class="mt-1.5 text-xs font-medium text-red-700">
          {{ error.message }}
        </p>
      }
    </fieldset>
  `,
})
export class EspacioSelector implements FormValueControl<string> {
  readonly value = model('');
  readonly touched = model(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

  readonly espacios = input.required<EspacioPublico[]>();
  readonly cargando = input(false);
  /** Prefijo único para el `name` del grupo y el id del error. */
  readonly idBase = input('reserva-espacio');

  protected readonly tipos = TIPO_ESPACIO_LABELS;

  protected elegir(espacio: EspacioPublico): void {
    this.value.set(String(espacio.id));
    this.touched.set(true);
  }
}
