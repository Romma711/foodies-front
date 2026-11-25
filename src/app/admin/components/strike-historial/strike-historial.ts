import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { I18n } from '@core/i18n/i18n.service';
import { TPipe } from '@core/i18n/t.pipe';
import { Clave, Mensaje } from '@core/i18n/traducir';
import { formatearFechaHora } from '../../../panel-restaurante/utils/panel-errors';
import { MovimientoStrike, OrigenStrike, TipoMovimientoStrike } from '../../models/entidades-admin';
import { AdminEntidadesService, TipoEntidad } from '../../services/admin-entidades.service';
import { mensajeDeErrorAdmin } from '../../services/mensaje-error-admin';

const MAXIMO = 255;

const TIPOS: Record<TipoMovimientoStrike, { texto: Clave; clases: string }> = {
  SUMA: { texto: 'admin.historial.tipo.SUMA', clases: 'bg-red-50 text-red-800 ring-red-200' },
  QUITA: {
    texto: 'admin.historial.tipo.QUITA',
    clases: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
};

const ORIGENES: Record<OrigenStrike, Clave> = {
  ADMIN: 'admin.historial.origen.ADMIN',
  AUSENCIAS: 'admin.historial.origen.AUSENCIAS',
};

/** Client or restaurant whose history is open. */
export interface ObjetivoHistorial {
  tipo: TipoEntidad;
  id: number;
  nombre: string;
}

let siguienteId = 0;

/**
 * Native `<dialog>` with the strike history of a client or a restaurant (who added or removed each
 * strike, why and when) and a form to remove one strike with a mandatory reason. Only the admin
 * dashboard uses it. The current count is read from the service, so the table row and the dialog
 * stay in sync after a removal.
 */
@Component({
  imports: [TPipe],
  selector: 'app-strike-historial',
  template: `
    <dialog
      #dialogo
      class="m-auto w-[min(48rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-ink-900 shadow-soft backdrop:bg-ink-900/40"
      [attr.aria-labelledby]="ids.titulo"
      (close)="alCerrar()"
    >
      <div class="p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 [id]="ids.titulo" class="text-lg font-extrabold tracking-tight">
              {{ 'admin.historial.titulo' | t: { nombre: objetivo()?.nombre ?? '' } }}
            </h2>
            <p class="mt-1 text-sm text-ink-500" data-testid="strikes-actuales">
              {{ 'admin.historial.actuales' | t: { n: strikes() } }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            (click)="cerrar()"
          >
            {{ 'admin.historial.cerrar' | t }}
          </button>
        </div>

        <div class="mt-5">
          @if (cargando()) {
            <p class="text-sm text-ink-500" role="status">{{ 'admin.historial.cargando' | t }}</p>
          } @else if (errorHistorial(); as mensaje) {
            <p class="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
              {{ mensaje | t }}
            </p>
          } @else if (movimientos().length === 0) {
            <p class="text-sm text-ink-500">{{ 'admin.historial.vacio' | t }}</p>
          } @else {
            <div class="max-h-80 overflow-auto rounded-xl ring-1 ring-line/60">
              <table class="w-full min-w-[40rem] text-left text-sm">
                <caption class="sr-only">
                  {{
                    'admin.historial.caption' | t
                  }}
                </caption>
                <thead
                  class="border-b border-line/60 text-xs font-bold uppercase tracking-wide text-ink-500"
                >
                  <tr>
                    <th scope="col" class="px-3 py-2">{{ 'admin.historial.fecha' | t }}</th>
                    <th scope="col" class="px-3 py-2">{{ 'admin.historial.movimiento' | t }}</th>
                    <th scope="col" class="px-3 py-2">{{ 'admin.historial.origen' | t }}</th>
                    <th scope="col" class="px-3 py-2">{{ 'admin.historial.motivo' | t }}</th>
                    <th scope="col" class="px-3 py-2 text-right">
                      {{ 'admin.historial.total' | t }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line/60">
                  @for (movimiento of movimientos(); track movimiento.id) {
                    <tr data-testid="movimiento">
                      <td class="whitespace-nowrap px-3 py-2 text-ink-700">
                        {{ fecha(movimiento.fecha) }}
                      </td>
                      <td class="px-3 py-2">
                        <span
                          class="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
                          [class]="tipos[movimiento.tipo].clases"
                        >
                          {{ tipos[movimiento.tipo].texto | t }}
                        </span>
                      </td>
                      <td class="px-3 py-2 text-ink-700">
                        {{ origenes[movimiento.origen] | t }}
                      </td>
                      <td class="px-3 py-2 text-ink-900">{{ movimiento.motivo }}</td>
                      <td class="px-3 py-2 text-right font-semibold tabular-nums">
                        {{ movimiento.totalDespues }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        @if (aviso(); as texto) {
          <p
            class="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
            role="status"
          >
            {{ texto | t: { n: strikes() } }}
          </p>
        }

        @if (strikes() > 0) {
          <form class="mt-6 border-t border-line/60 pt-5" novalidate (submit)="quitar($event)">
            <label [for]="ids.motivo" class="block text-sm font-semibold text-ink-700">
              {{ 'admin.historial.quitarMotivo' | t }}
            </label>
            <textarea
              [id]="ids.motivo"
              rows="3"
              class="mt-2 block w-full resize-y rounded-xl border px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              [class]="mostrarError() ? 'border-red-700' : 'border-ink-400'"
              [attr.maxlength]="maximo"
              [attr.aria-invalid]="mostrarError()"
              [attr.aria-describedby]="ids.error"
              [placeholder]="'admin.historial.placeholder' | t"
              [value]="motivo()"
              (input)="motivo.set($any($event.target).value)"
            ></textarea>
            <p [id]="ids.error" class="mt-1.5 text-xs font-medium text-red-800">
              @if (mostrarError()) {
                {{ 'admin.historial.motivoObligatorio' | t }}
              }
            </p>

            @if (errorQuitar(); as mensaje) {
              <p
                class="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
                role="alert"
              >
                {{ mensaje | t }}
              </p>
            }

            <div class="mt-4 flex justify-end">
              <button
                type="submit"
                class="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:cursor-progress disabled:opacity-60"
                [disabled]="quitando()"
              >
                {{ (quitando() ? 'admin.historial.quitando' : 'admin.historial.quitar') | t }}
              </button>
            </div>
          </form>
        } @else {
          <p class="mt-6 border-t border-line/60 pt-5 text-sm text-ink-500">
            {{ 'admin.historial.sinStrikes' | t }}
          </p>
        }
      </div>
    </dialog>
  `,
})
export class StrikeHistorial {
  private readonly servicio = inject(AdminEntidadesService);
  private readonly i18n = inject(I18n);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tipos = TIPOS;
  protected readonly origenes = ORIGENES;
  protected readonly maximo = MAXIMO;
  protected readonly ids = {
    titulo: `historial-titulo-${siguienteId}`,
    motivo: `historial-motivo-${siguienteId}`,
    error: `historial-error-${siguienteId++}`,
  };

  protected readonly objetivo = signal<ObjetivoHistorial | null>(null);
  protected readonly movimientos = signal<MovimientoStrike[]>([]);
  protected readonly cargando = signal(false);
  protected readonly errorHistorial = signal<Mensaje | null>(null);
  protected readonly motivo = signal('');
  protected readonly quitando = signal(false);
  protected readonly errorQuitar = signal<Mensaje | null>(null);
  /** Confirmation after a removal; filled with the current count when shown. */
  protected readonly aviso = signal<Clave | null>(null);
  private readonly intentoQuitar = signal(false);

  /** Current strikes of the open entity, from the same list the table shows. */
  protected readonly strikes = computed(() => {
    const objetivo = this.objetivo();
    if (!objetivo) {
      return 0;
    }
    const lista =
      objetivo.tipo === 'cliente' ? this.servicio.clientes() : this.servicio.restaurantes();
    return lista.find((entidad) => entidad.id === objetivo.id)?.strikes ?? 0;
  });
  protected readonly mostrarError = computed(
    () => this.intentoQuitar() && this.motivo().trim() === '',
  );

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private carga?: Subscription;

  abrir(objetivo: ObjetivoHistorial): void {
    this.objetivo.set(objetivo);
    this.motivo.set('');
    this.intentoQuitar.set(false);
    this.errorQuitar.set(null);
    this.aviso.set(null);
    this.cargarHistorial();
    const dialogo = this.dialogo().nativeElement;
    if (typeof dialogo.showModal === 'function') {
      dialogo.showModal();
    } else {
      dialogo.setAttribute('open', '');
    }
  }

  protected cerrar(): void {
    const dialogo = this.dialogo().nativeElement;
    if (typeof dialogo.close === 'function' && dialogo.open) {
      dialogo.close();
    } else {
      dialogo.removeAttribute('open');
      this.alCerrar();
    }
  }

  protected alCerrar(): void {
    this.carga?.unsubscribe();
    this.objetivo.set(null);
  }

  protected fecha(valor: string): string {
    return formatearFechaHora(valor, this.i18n.locale());
  }

  protected quitar(evento: Event): void {
    evento.preventDefault();
    this.intentoQuitar.set(true);
    const objetivo = this.objetivo();
    const motivo = this.motivo().trim();
    if (!objetivo || motivo === '' || this.quitando()) {
      return;
    }
    this.quitando.set(true);
    this.errorQuitar.set(null);
    this.aviso.set(null);
    this.servicio
      .quitarStrike(objetivo.tipo, objetivo.id, motivo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.quitando.set(false);
          this.motivo.set('');
          this.intentoQuitar.set(false);
          this.aviso.set('admin.historial.quitado');
          this.cargarHistorial();
        },
        error: (error: Error) => {
          this.quitando.set(false);
          this.errorQuitar.set(mensajeDeErrorAdmin(error, 'admin.error.quitarStrike'));
        },
      });
  }

  private cargarHistorial(): void {
    const objetivo = this.objetivo();
    if (!objetivo) {
      return;
    }
    this.carga?.unsubscribe();
    this.cargando.set(true);
    this.errorHistorial.set(null);
    this.carga = this.servicio
      .historialStrikes(objetivo.tipo, objetivo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movimientos) => {
          this.cargando.set(false);
          this.movimientos.set(movimientos);
        },
        error: (error: Error) => {
          this.cargando.set(false);
          this.movimientos.set([]);
          this.errorHistorial.set(mensajeDeErrorAdmin(error, 'admin.error.historialStrikes'));
        },
      });
  }
}
