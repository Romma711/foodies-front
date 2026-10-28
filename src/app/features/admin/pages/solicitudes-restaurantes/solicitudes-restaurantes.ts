import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { especialidadLabel } from '../../../../core/catalog/especialidades';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ToastOutlet } from '../../../../shared/toast/toast-outlet';
import { SolicitudRestaurante } from '../../models/entidades-admin';
import { AdminSolicitudesService } from '../../services/admin-solicitudes.service';

/** Pending restaurant sign-ups: approve publishes them, reject asks for confirmation first. */
@Component({
  selector: 'app-solicitudes-restaurantes',
  imports: [ToastOutlet],
  providers: [ToastService],
  template: `
    <section aria-labelledby="titulo-solicitudes">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Panel</p>
          <h1
            id="titulo-solicitudes"
            class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
          >
            Solicitudes
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Restaurantes que pidieron sumarse a Foodies. Al aprobarlos aparecen en el catálogo y su
            encargado puede entrar al panel.
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
        <ul class="mt-8 grid gap-4 lg:grid-cols-2">
          @for (solicitud of solicitudes(); track solicitud.restaurantId) {
            <li
              class="flex flex-col rounded-2xl border border-line/60 bg-white p-5 shadow-sm sm:p-6"
              data-testid="solicitud"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {{ especialidad(solicitud) }}
                  </p>
                  <h2 class="mt-1 truncate text-lg font-extrabold tracking-tight text-ink-900">
                    {{ solicitud.nombre }}
                  </h2>
                </div>
                <span
                  class="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200"
                >
                  Pendiente
                </span>
              </div>

              <dl class="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-xs text-ink-500">Dirección</dt>
                  <dd class="font-medium text-ink-700">{{ solicitud.ubicacion }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-ink-500">Capacidad</dt>
                  <dd class="font-medium text-ink-700">{{ solicitud.cupoMaximo }} personas</dd>
                </div>
                <div class="min-w-0">
                  <dt class="text-xs text-ink-500">Email</dt>
                  <dd class="truncate font-medium text-ink-700">{{ solicitud.email }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-ink-500">Teléfono</dt>
                  <dd class="font-medium text-ink-700">{{ solicitud.telefono }}</dd>
                </div>
              </dl>

              <div
                class="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line/60 pt-4"
              >
                @if (confirmandoId() === solicitud.restaurantId) {
                  <span class="mr-auto text-sm font-semibold text-ink-900">
                    ¿Rechazar la solicitud?
                  </span>
                  <button
                    type="button"
                    class="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-cream-100 disabled:opacity-60"
                    [id]="'cancelar-' + solicitud.restaurantId"
                    [disabled]="procesandoId() === solicitud.restaurantId"
                    (click)="cancelar(solicitud.restaurantId)"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-progress disabled:opacity-60"
                    [disabled]="procesandoId() === solicitud.restaurantId"
                    (click)="rechazar(solicitud)"
                  >
                    {{
                      procesandoId() === solicitud.restaurantId
                        ? 'Rechazando…'
                        : 'Confirmar rechazo'
                    }}
                  </button>
                } @else {
                  <button
                    type="button"
                    class="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-red-50 hover:text-red-700 hover:ring-red-100 disabled:opacity-60"
                    [id]="'rechazar-' + solicitud.restaurantId"
                    [attr.aria-label]="'Rechazar ' + solicitud.nombre"
                    [disabled]="procesandoId() === solicitud.restaurantId"
                    (click)="pedirConfirmacion(solicitud.restaurantId)"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    class="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 disabled:cursor-progress disabled:opacity-60"
                    [attr.aria-label]="'Aprobar ' + solicitud.nombre"
                    [disabled]="procesandoId() === solicitud.restaurantId"
                    (click)="aprobar(solicitud)"
                  >
                    {{ procesandoId() === solicitud.restaurantId ? 'Aprobando…' : 'Aprobar' }}
                  </button>
                }
              </div>
            </li>
          }
        </ul>
      } @else if (cargando()) {
        <div class="mt-8" role="status">
          <span class="sr-only">Cargando solicitudes…</span>
          <div class="grid gap-4 lg:grid-cols-2" aria-hidden="true">
            @for (item of skeletons; track item) {
              <div class="space-y-3 rounded-2xl border border-line/60 bg-white p-6 shadow-sm">
                <span
                  class="block h-4 w-1/3 rounded-full bg-cream-100 motion-safe:animate-pulse"
                ></span>
                <span class="block h-3 rounded-full bg-cream-100 motion-safe:animate-pulse"></span>
                <span
                  class="block h-3 w-2/3 rounded-full bg-cream-100 motion-safe:animate-pulse"
                ></span>
              </div>
            }
          </div>
        </div>
      } @else if (!error()) {
        <div
          class="mt-8 flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-white px-6 py-16 text-center shadow-sm"
        >
          <h2 class="text-lg font-bold text-ink-900">No hay solicitudes pendientes</h2>
          <p class="mt-2 max-w-sm text-sm leading-6 text-ink-500">
            Cuando un restaurante se registre, su solicitud va a aparecer acá.
          </p>
        </div>
      }
    </section>

    <app-toast-outlet />
  `,
})
export class SolicitudesRestaurantes {
  private readonly servicio = inject(AdminSolicitudesService);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly solicitudes = this.servicio.solicitudes;
  protected readonly cargando = this.servicio.cargando;
  protected readonly error = this.servicio.error;

  protected readonly confirmandoId = signal<number | null>(null);
  protected readonly procesandoId = signal<number | null>(null);
  protected readonly skeletons = [1, 2];

  constructor() {
    this.recargar();
  }

  protected especialidad(solicitud: SolicitudRestaurante): string {
    return especialidadLabel(solicitud.especialidad);
  }

  protected recargar(): void {
    this.servicio
      .cargar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected pedirConfirmacion(id: number): void {
    this.confirmandoId.set(id);
    this.enfocar(`cancelar-${id}`);
  }

  protected cancelar(id: number): void {
    this.confirmandoId.set(null);
    this.enfocar(`rechazar-${id}`);
  }

  protected aprobar(solicitud: SolicitudRestaurante): void {
    this.procesandoId.set(solicitud.restaurantId);
    this.servicio
      .aprobar(solicitud.restaurantId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.terminar(`${solicitud.nombre} fue aprobado y ya aparece en el catálogo.`),
        error: (error: Error) => this.fallar(error),
      });
  }

  protected rechazar(solicitud: SolicitudRestaurante): void {
    this.procesandoId.set(solicitud.restaurantId);
    this.servicio
      .rechazar(solicitud.restaurantId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.terminar(`Se rechazó la solicitud de ${solicitud.nombre}.`),
        error: (error: Error) => this.fallar(error),
      });
  }

  private terminar(mensaje: string): void {
    this.procesandoId.set(null);
    this.confirmandoId.set(null);
    this.toasts.exito(mensaje);
  }

  private fallar(error: Error): void {
    this.procesandoId.set(null);
    this.toasts.error(error.message);
  }

  /** Keeps keyboard users in place when the card swaps its buttons. */
  private enfocar(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), {
      injector: this.injector,
    });
  }
}
