import { Component, inject, input, model, output } from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { I18n } from '@core/i18n/i18n.service';
import { TClavePipe, TPipe } from '@core/i18n/t.pipe';
import { TurnoDisponible } from '../../models/disponibilidad';
import { turnoLleno } from '../../utils/turnos';

/**
 * Shift choice of a reservation when the restaurant works with shifts (rule D2). Used with
 * `[formField]`: the value is the shift id as text. Each shift shows its free seats per espacio;
 * a full shift cannot be chosen and offers the waitlist instead.
 */
@Component({
  imports: [TClavePipe, TPipe],
  selector: 'app-turno-selector',
  template: `
    <fieldset [attr.aria-describedby]="errors().length && touched() ? idBase() + '-error' : null">
      <legend class="text-sm font-bold text-ink-900">{{ 'reserva.turno' | t }}</legend>
      @if (cargando()) {
        <p class="mt-2 text-sm text-ink-500" role="status">{{ 'reserva.turno.buscando' | t }}</p>
      } @else if (turnos().length === 0) {
        <p class="mt-2 text-sm font-medium text-red-700" role="status" data-testid="sin-turnos">
          {{ 'reserva.turno.ninguno' | t }}
        </p>
      } @else {
        <div class="mt-2 grid gap-2">
          @for (turno of turnos(); track turno.idTurno) {
            @let lleno = estaLleno(turno);
            <div
              class="grid justify-items-start gap-2 rounded-xl border px-4 py-2.5 text-sm transition has-checked:border-brand-500 has-checked:bg-brand-500/10"
              [class.border-line]="value() !== '' + turno.idTurno"
              [attr.data-turno]="turno.idTurno"
            >
              <label
                class="flex min-h-11 w-full items-center gap-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-700"
                [class.cursor-pointer]="!lleno"
                [class.cursor-not-allowed]="lleno"
              >
                <input
                  type="radio"
                  class="size-4 accent-ink-900"
                  [name]="idBase()"
                  [value]="turno.idTurno"
                  [disabled]="lleno"
                  [checked]="value() === '' + turno.idTurno"
                  (change)="elegir(turno)"
                  (blur)="touched.set(true)"
                />
                <span class="flex flex-col">
                  <span class="font-semibold text-ink-900">
                    {{
                      'reserva.turno.rango'
                        | t: { inicio: turno.inicio ?? '', fin: turno.fin ?? '' }
                    }}
                    @if (lleno) {
                      <span class="ml-1 text-xs font-bold text-red-700">{{
                        'reserva.turno.completo' | t
                      }}</span>
                    }
                  </span>
                  <span class="text-xs text-ink-500">{{ libres(turno) }}</span>
                </span>
              </label>
              @if (lleno && conListaEspera()) {
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-progress disabled:opacity-60"
                  [disabled]="anotando()"
                  (click)="listaEspera.emit(turno)"
                >
                  {{ 'listaEspera.sumarme' | t }}
                </button>
              }
            </div>
          }
        </div>
      }
      @if (touched() && errors()[0]; as error) {
        <p [id]="idBase() + '-error'" class="mt-1.5 text-xs font-medium text-red-700">
          {{ error.message | tClave }}
        </p>
      }
    </fieldset>
  `,
})
export class TurnoSelector implements FormValueControl<string> {
  private readonly i18n = inject(I18n);

  readonly value = model('');
  readonly touched = model(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);

  readonly turnos = input.required<TurnoDisponible[]>();
  /** Party size: a shift is full when no espacio has that many free seats. */
  readonly cantidad = input.required<number>();
  readonly cargando = input(false);
  /** Disables the waitlist buttons while a join request is in flight. */
  readonly anotando = input(false);
  /** False in the edit form, where joining a waitlist makes no sense. */
  readonly conListaEspera = input(true);
  /** Unique prefix for the group `name` and the error id. */
  readonly idBase = input('reserva-turno');

  /** The client asks to join the waitlist of a full shift. */
  readonly listaEspera = output<TurnoDisponible>();

  protected estaLleno(turno: TurnoDisponible): boolean {
    return turnoLleno(turno, this.cantidad());
  }

  /** "Salón principal: 12 lugares · Patio: completo". */
  protected libres(turno: TurnoDisponible): string {
    return turno.espacios
      .map((espacio) =>
        espacio.libres > 0
          ? this.i18n.t(espacio.libres === 1 ? 'reserva.turno.libre' : 'reserva.turno.libres', {
              nombre: espacio.nombre,
              n: espacio.libres,
            })
          : this.i18n.t('reserva.turno.espacioCompleto', { nombre: espacio.nombre }),
      )
      .join(' · ');
  }

  protected elegir(turno: TurnoDisponible): void {
    this.value.set(String(turno.idTurno));
    this.touched.set(true);
  }
}
