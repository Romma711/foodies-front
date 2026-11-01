import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SolicitudRestaurante } from '../../models/solicitud-restaurante';
import { AdminSolicitudesService } from '../../services/admin-solicitudes.service';

/** Detalle de un restaurante pendiente, con el botón para aceptarlo. */
@Component({
  selector: 'app-detalle-solicitud',
  imports: [RouterLink],
  template: `
    <a
      routerLink="/admin/aceptar"
      class="inline-flex items-center gap-1 rounded-full text-sm font-semibold text-ink-500 transition hover:text-ink-900"
    >
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
        <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
      </svg>
      Volver a las solicitudes
    </a>

    @if (aceptado(); as nombre) {
      <section
        class="mt-6 rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center"
        role="status"
      >
        <h1 #titulo tabindex="-1" class="text-2xl font-extrabold tracking-tight text-green-900">
          {{ nombre }} fue aceptado
        </h1>
        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-green-900">
          Ya figura en el catálogo y su encargado puede entrar al panel del restaurante.
        </p>
        <a
          routerLink="/admin/aceptar"
          class="mt-6 inline-flex items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700"
        >
          Ver otras solicitudes
        </a>
      </section>
    } @else if (solicitud(); as resto) {
      <section class="mt-6" aria-labelledby="titulo-detalle">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <span
              class="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900"
            >
              Pendiente de aprobación
            </span>
            <h1
              id="titulo-detalle"
              class="mt-3 text-3xl font-extrabold tracking-tight break-words text-ink-900 sm:text-4xl"
            >
              {{ resto.nombre }}
            </h1>
          </div>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-progress disabled:opacity-70"
            [disabled]="aprobando()"
            (click)="aceptar(resto)"
          >
            <svg
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m5 12 5 5L20 7" />
            </svg>
            {{ aprobando() ? 'Aceptando…' : 'Aceptar' }}
          </button>
        </div>

        @if (errorAprobar(); as mensaje) {
          <p
            class="mt-6 rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 text-sm font-medium text-red-800"
            role="alert"
          >
            {{ mensaje }}
          </p>
        }

        <dl
          class="mt-8 grid gap-4 rounded-2xl border border-line/60 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <div>
            <dt class="text-xs font-bold uppercase tracking-wide text-ink-500">
              Email del encargado
            </dt>
            <dd class="mt-1 font-semibold break-all text-ink-900">{{ resto.email }}</dd>
          </div>
          <div>
            <dt class="text-xs font-bold uppercase tracking-wide text-ink-500">Teléfono</dt>
            <dd class="mt-1 font-semibold text-ink-900">{{ resto.telefono || 'Sin teléfono' }}</dd>
          </div>
        </dl>

        <h2 class="mt-10 text-lg font-bold text-ink-900">Fotos</h2>
        @if (resto.fotos.length > 0) {
          <ul class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            @for (foto of resto.fotos; track foto.id; let i = $index) {
              <li class="relative overflow-hidden rounded-2xl border border-line/60 bg-cream-100">
                <img
                  [src]="foto.url"
                  [alt]="'Foto ' + (i + 1) + ' de ' + resto.nombre"
                  loading="lazy"
                  class="aspect-[4/3] w-full object-cover"
                />
                @if (foto.portada) {
                  <span
                    class="absolute top-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-700"
                  >
                    Portada
                  </span>
                }
              </li>
            }
          </ul>
        } @else {
          <p class="mt-2 text-sm text-ink-500">Este restaurante no subió fotos.</p>
        }
      </section>
    } @else if (cargando()) {
      <p class="mt-6 text-sm font-medium text-ink-500" role="status">Cargando restaurante…</p>
    } @else if (error(); as mensaje) {
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
    } @else {
      <section
        class="mt-6 rounded-2xl border border-line/60 bg-white px-6 py-16 text-center shadow-sm"
      >
        <h1 class="text-lg font-bold text-ink-900">Esta solicitud ya no está pendiente</h1>
        <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
          Puede que el restaurante ya haya sido aceptado o que el enlace no sea correcto.
        </p>
      </section>
    }
  `,
})
export class DetalleSolicitud {
  private readonly solicitudesService = inject(AdminSolicitudesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  /** Bound from the `:usuarioId` route param. */
  readonly usuarioId = input.required({ transform: numberAttribute });

  private readonly titulo = viewChild<ElementRef<HTMLElement>>('titulo');

  protected readonly cargando = this.solicitudesService.cargando;
  protected readonly error = this.solicitudesService.error;
  protected readonly solicitud = computed(() =>
    this.solicitudesService.solicitudes().find((solicitud) => solicitud.id === this.usuarioId()),
  );

  protected readonly aprobando = signal(false);
  protected readonly errorAprobar = signal<string | null>(null);
  /** Nombre del restaurante recién aceptado; ya no está en la lista de pendientes. */
  protected readonly aceptado = signal<string | null>(null);

  constructor() {
    // Siempre se recarga: la lista en memoria puede haber quedado vieja desde otra pestaña.
    this.recargar();
  }

  protected recargar(): void {
    this.solicitudesService
      .cargar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected async aceptar(solicitud: SolicitudRestaurante): Promise<void> {
    this.aprobando.set(true);
    this.errorAprobar.set(null);
    try {
      await firstValueFrom(this.solicitudesService.aprobar(solicitud.id));
      this.aceptado.set(solicitud.nombre);
      // El botón desaparece: el foco pasa al mensaje para no perderse.
      afterNextRender(() => this.titulo()?.nativeElement.focus(), { injector: this.injector });
    } catch (error) {
      this.errorAprobar.set(error instanceof Error ? error.message : 'No se pudo aceptar.');
    } finally {
      this.aprobando.set(false);
    }
  }
}
