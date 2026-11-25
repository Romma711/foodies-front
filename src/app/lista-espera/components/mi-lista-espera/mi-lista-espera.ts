import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { I18n } from '@core/i18n/i18n.service';
import { TPipe } from '@core/i18n/t.pipe';
import { formatearFechaReserva, formatearHora } from '../../../reservas/utils/reserva-formato';
import {
  ESTADO_LISTA_ESPERA_LABELS,
  EstadoListaEspera,
  entradaAbierta,
} from '../../models/lista-espera';
import { ListaEsperaService } from '../../services/lista-espera.service';

/** "Mi lista de espera": the client's waitlist entries with their state, and leaving one (D15). */
@Component({
  imports: [TPipe],
  selector: 'app-mi-lista-espera',
  template: `
    <section class="mt-12" aria-labelledby="lista-espera-titulo">
      <h2 id="lista-espera-titulo" class="text-xl font-extrabold tracking-tight text-ink-900">
        {{ 'listaEspera.titulo' | t }}
      </h2>
      <p class="mt-1 text-sm leading-6 text-ink-500">{{ 'listaEspera.bajada' | t }}</p>

      @if (error(); as mensaje) {
        <p
          role="alert"
          class="mt-4 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-800"
        >
          {{ mensaje | t }}
        </p>
      }

      @if (cargando()) {
        <p class="mt-4 text-sm text-ink-500" role="status">{{ 'listaEspera.cargando' | t }}</p>
      } @else if (entradas().length === 0) {
        <p class="mt-4 text-sm text-ink-500" data-testid="lista-vacia">
          {{ 'listaEspera.vacia' | t }}
        </p>
      } @else {
        <ul class="mt-4 space-y-3">
          @for (entrada of entradas(); track entrada.id) {
            <li
              class="rounded-2xl border border-line/70 bg-white/90 p-4 shadow-card"
              [attr.data-entrada]="entrada.id"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate font-bold text-ink-900">{{ entrada.nombreResto }}</p>
                  <p class="text-sm text-ink-500">
                    {{
                      'listaEspera.detalle'
                        | t
                          : {
                              fecha: fecha(entrada.fecha),
                              hora: hora(entrada.horario),
                              cantidad: entrada.cantidad,
                            }
                    }}
                  </p>
                </div>
                <span [class]="clases(entrada.estado)">{{ etiquetas[entrada.estado] | t }}</span>
              </div>
              @if (entrada.estado === 'NOTIFICADA') {
                <p class="mt-3 text-sm text-emerald-900">{{ 'listaEspera.notificada' | t }}</p>
              }
              @if (abierta(entrada)) {
                @if (saliendoId() === entrada.id) {
                  <div
                    class="mt-3 flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                    role="group"
                    [attr.aria-label]="'listaEspera.confirmarSalir' | t"
                  >
                    <p class="text-sm font-medium text-amber-900">
                      {{ 'listaEspera.preguntaSalir' | t }}
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        [disabled]="saving()"
                        class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:opacity-60"
                        (click)="saliendoId.set(null)"
                      >
                        {{ 'listaEspera.quedarme' | t }}
                      </button>
                      <button
                        type="button"
                        [disabled]="saving()"
                        class="inline-flex items-center justify-center rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
                        (click)="salir(entrada.id)"
                      >
                        {{ 'listaEspera.siSalir' | t }}
                      </button>
                    </div>
                  </div>
                } @else {
                  <div class="mt-3 flex justify-end">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                      (click)="iniciarSalida(entrada.id)"
                    >
                      {{ 'listaEspera.salir' | t }}
                    </button>
                  </div>
                }
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class MiListaEspera {
  private readonly service = inject(ListaEsperaService);
  private readonly i18n = inject(I18n);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly entradas = this.service.entradas;
  protected readonly cargando = this.service.loading;
  protected readonly saving = this.service.saving;
  protected readonly error = this.service.error;
  protected readonly etiquetas = ESTADO_LISTA_ESPERA_LABELS;
  protected readonly abierta = entradaAbierta;
  /** Entry whose leave confirmation is open. */
  protected readonly saliendoId = signal<number | null>(null);

  constructor() {
    this.service
      .listarMias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected fecha(valor: string): string {
    return formatearFechaReserva(`${valor}T00:00:00`, this.i18n.locale());
  }

  protected hora(valor: string): string {
    return formatearHora(valor);
  }

  protected iniciarSalida(id: number): void {
    this.service.limpiarError();
    this.saliendoId.set(id);
  }

  protected salir(id: number): void {
    this.service
      .salir(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.saliendoId.set(null), error: () => undefined });
  }

  protected clases(estado: EstadoListaEspera): string {
    const base =
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset';
    switch (estado) {
      case 'ESPERANDO':
        return `${base} bg-amber-50 text-amber-800 ring-amber-200`;
      case 'NOTIFICADA':
        return `${base} bg-emerald-50 text-emerald-800 ring-emerald-200`;
      default:
        return `${base} bg-cream-100 text-ink-600 ring-line`;
    }
  }
}
