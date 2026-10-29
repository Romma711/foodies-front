import { Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';

const MINIMO = 5;
const MAXIMO = 255;
/** Strikes after which the panel suggests deactivating the account. */
export const LIMITE_STRIKES = 3;

let siguienteId = 0;

/**
 * Native `<dialog>` to apply a strike with its reason. Presentational: it emits the reason and the
 * parent calls the API, then closes it or passes back `error`. Escape and "Cancelar" close it,
 * except while `enviando`.
 */
@Component({
  selector: 'app-strike-modal',
  template: `
    <dialog
      #dialogo
      class="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-ink-900 shadow-soft backdrop:bg-ink-900/40"
      [attr.aria-labelledby]="ids.titulo"
      [attr.aria-describedby]="ids.descripcion"
      (cancel)="alPedirCancelar($event)"
      (close)="alCerrar()"
    >
      <form class="p-6" novalidate (submit)="confirmar($event)">
        <h2 [id]="ids.titulo" class="text-lg font-extrabold tracking-tight">
          Aplicar strike a {{ nombre() }}
        </h2>
        <p [id]="ids.descripcion" class="mt-2 text-sm leading-6 text-ink-500">
          Va a ser el strike {{ proximo() }} de {{ limite }}. Le vamos a enviar un email de aviso
          con el motivo.
        </p>
        @if (proximo() >= limite) {
          <p
            class="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800 ring-1 ring-red-100"
            data-testid="aviso-limite"
          >
            Con este strike llega al límite: el panel va a sugerir darlo de baja.
          </p>
        }

        <label [for]="ids.motivo" class="mt-5 block text-sm font-semibold text-ink-700">
          Motivo
        </label>
        <textarea
          [id]="ids.motivo"
          rows="4"
          class="mt-2 block w-full resize-y rounded-xl border px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          [class]="mostrarError() ? 'border-red-700' : 'border-ink-400'"
          [attr.maxlength]="maximo"
          [attr.aria-invalid]="mostrarError()"
          [attr.aria-describedby]="(mostrarError() ? ids.error + ' ' : '') + ids.contador"
          placeholder="Ej.: lenguaje ofensivo en una reseña"
          [value]="motivo()"
          (input)="motivo.set($any($event.target).value)"
        ></textarea>
        <div class="mt-1.5 flex items-start justify-between gap-3 text-xs">
          <p [id]="ids.error" class="font-medium text-red-800">
            @if (mostrarError()) {
              El motivo debe tener al menos {{ minimo }} caracteres.
            }
          </p>
          <p [id]="ids.contador" class="shrink-0 tabular-nums text-ink-500" data-testid="contador">
            {{ motivo().length }}/{{ maximo }}
          </p>
        </div>

        @if (error(); as mensaje) {
          <p
            class="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
            role="alert"
          >
            {{ mensaje }}
          </p>
        }

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-cream-100 disabled:opacity-60"
            [disabled]="enviando()"
            (click)="cerrarDialogo(false)"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-progress disabled:opacity-60"
            [disabled]="enviando()"
          >
            {{ enviando() ? 'Aplicando…' : 'Aplicar strike' }}
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class StrikeModal {
  readonly nombre = input.required<string>();
  readonly strikesActuales = input.required<number>();
  readonly enviando = input(false);
  /** Error from the API call, shown inside the dialog. */
  readonly error = input<string | null>(null);

  readonly enviar = output<string>();
  readonly cancelar = output<void>();

  protected readonly limite = LIMITE_STRIKES;
  protected readonly minimo = MINIMO;
  protected readonly maximo = MAXIMO;
  protected readonly ids = {
    titulo: `strike-titulo-${siguienteId}`,
    descripcion: `strike-descripcion-${siguienteId}`,
    motivo: `strike-motivo-${siguienteId}`,
    error: `strike-error-${siguienteId}`,
    contador: `strike-contador-${siguienteId++}`,
  };

  protected readonly motivo = signal('');
  private readonly intentoEnviar = signal(false);
  protected readonly proximo = computed(() => this.strikesActuales() + 1);
  protected readonly mostrarError = computed(
    () => this.intentoEnviar() && this.motivo().trim().length < MINIMO,
  );

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  /** Set while the parent closes the dialog, so the native close event is not reported as a cancel. */
  private cerrandoDesdePadre = false;

  abrir(): void {
    this.motivo.set('');
    this.intentoEnviar.set(false);
    const dialogo = this.dialogo().nativeElement;
    if (typeof dialogo.showModal === 'function') {
      dialogo.showModal();
    } else {
      dialogo.setAttribute('open', '');
    }
  }

  /** Closes after a successful strike. Does not emit `cancelar`. */
  cerrar(): void {
    this.cerrarDialogo(true);
  }

  protected cerrarDialogo(desdePadre: boolean): void {
    this.cerrandoDesdePadre = desdePadre;
    const dialogo = this.dialogo().nativeElement;
    if (typeof dialogo.close === 'function' && dialogo.open) {
      // The native close event runs alCerrar().
      dialogo.close();
    } else {
      dialogo.removeAttribute('open');
      this.alCerrar();
    }
  }

  protected confirmar(evento: Event): void {
    evento.preventDefault();
    this.intentoEnviar.set(true);
    const motivo = this.motivo().trim();
    if (motivo.length < MINIMO || this.enviando()) {
      return;
    }
    this.enviar.emit(motivo);
  }

  /** Escape fires `cancel`; while the strike is being sent it is ignored so the error stays visible. */
  protected alPedirCancelar(evento: Event): void {
    if (this.enviando()) {
      evento.preventDefault();
    }
  }

  /** Escape, "Cancelar" or `cerrar()`: only a user-initiated close counts as cancel. */
  protected alCerrar(): void {
    if (!this.cerrandoDesdePadre) {
      this.cancelar.emit();
    }
    this.cerrandoDesdePadre = false;
  }
}
