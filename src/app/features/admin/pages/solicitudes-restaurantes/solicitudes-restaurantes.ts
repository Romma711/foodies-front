import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Foto } from '../../../../restaurantes/utils/fotos';
import { AdminSolicitudesService } from '../../services/admin-solicitudes.service';

/** Restaurantes pendientes de aprobación. Se aceptan o rechazan desde su detalle, después de revisarlos. */
@Component({
  selector: 'app-solicitudes-restaurantes',
  imports: [RouterLink],
  template: `
    <section aria-labelledby="titulo-solicitudes">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Panel</p>
          <h1
            id="titulo-solicitudes"
            class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
          >
            Aceptar restaurantes
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Estos restaurantes se registraron y esperan tu aprobación. Entrá al detalle de cada uno
            para revisarlo y aceptarlo o rechazarlo.
          </p>
        </div>
        @if (solicitudes().length > 0) {
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 disabled:opacity-60"
            [disabled]="cargando()"
            (click)="recargar()"
          >
            {{ cargando() ? 'Actualizando…' : 'Actualizar' }}
          </button>
        }
      </div>

      @if (error(); as mensaje) {
        <div
          class="mt-6 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p class="text-sm font-medium text-red-800">{{ mensaje }}</p>
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
            (click)="recargar()"
          >
            Reintentar
          </button>
        </div>
      }

      @if (solicitudes().length > 0) {
        <ul
          class="mt-8 divide-y divide-line/60 rounded-2xl border border-line/60 bg-white shadow-sm"
        >
          @for (solicitud of solicitudes(); track solicitud.restaurantId) {
            <li class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex min-w-0 items-center gap-4">
                <span
                  class="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-lg font-extrabold text-brand-700"
                  aria-hidden="true"
                >
                  @if (portada(solicitud.fotos); as url) {
                    <img [src]="url" alt="" class="size-full object-cover" />
                  } @else {
                    {{ solicitud.nombre.charAt(0).toUpperCase() }}
                  }
                </span>
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold text-ink-900">{{ solicitud.nombre }}</h2>
                  <p class="truncate text-sm text-ink-500">{{ solicitud.email }}</p>
                </div>
              </div>
              <a
                class="inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-line transition hover:bg-cream-100"
                [routerLink]="['/admin/aceptar', solicitud.restaurantId]"
                [attr.aria-label]="'Ver detalles de ' + solicitud.nombre"
              >
                Ver detalles
                <svg
                  class="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14m0 0-6-6m6 6-6 6" />
                </svg>
              </a>
            </li>
          }
        </ul>
      } @else if (cargando()) {
        <p class="mt-8 text-sm font-medium text-ink-500" role="status">Cargando solicitudes…</p>
      } @else if (!error()) {
        <div
          class="mt-8 flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-white px-6 py-16 text-center shadow-sm"
        >
          <h2 class="text-lg font-bold text-ink-900">No hay restaurantes por aceptar</h2>
          <p class="mt-2 max-w-sm text-sm leading-6 text-ink-500">
            Cuando un restaurante se registre, va a aparecer acá para que lo revises.
          </p>
        </div>
      }
    </section>
  `,
})
export class SolicitudesRestaurantes {
  private readonly solicitudesService = inject(AdminSolicitudesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly solicitudes = this.solicitudesService.solicitudes;
  protected readonly cargando = this.solicitudesService.cargando;
  protected readonly error = this.solicitudesService.error;

  constructor() {
    this.recargar();
  }

  protected portada(fotos: Foto[]): string | null {
    return (fotos.find((foto) => foto.portada) ?? fotos[0])?.url ?? null;
  }

  protected recargar(): void {
    this.solicitudesService
      .cargar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
