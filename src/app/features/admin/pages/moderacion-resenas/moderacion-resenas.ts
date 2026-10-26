import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ToastOutlet } from '../../../../shared/toast/toast-outlet';
import { StarRating } from '../../../resenas/components/star-rating/star-rating';
import { AdminModeracionService } from '../../services/admin-moderacion.service';

/** Recent reviews from every restaurant, with a confirmed quick delete per row. */
@Component({
  selector: 'app-moderacion-resenas',
  imports: [RouterLink, StarRating, ToastOutlet],
  providers: [ToastService],
  template: `
    <section aria-labelledby="titulo-moderacion">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Panel</p>
          <h1
            id="titulo-moderacion"
            class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
          >
            Moderación
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Revisá las reseñas recientes y eliminá las que no cumplan las normas de la comunidad.
          </p>
        </div>
        @if (resenas().length > 0) {
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
          data-testid="moderacion-error"
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

      @if (resenas().length > 0) {
        <div class="mt-8 overflow-x-auto rounded-2xl border border-line/60 bg-white shadow-sm">
          <table class="w-full min-w-[36rem] text-left text-sm">
            <caption class="sr-only">
              Reseñas recientes, de la más nueva a la más vieja
            </caption>
            <thead
              class="border-b border-line/60 text-xs font-bold uppercase tracking-wide text-ink-500"
            >
              <tr>
                <th scope="col" class="px-4 py-3">Reseña</th>
                <th scope="col" class="px-4 py-3">Calificación</th>
                <th scope="col" class="px-4 py-3">Autor</th>
                <th scope="col" class="px-4 py-3">Restaurante</th>
                <th scope="col" class="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/60">
              @for (resena of resenas(); track resena.id) {
                <tr class="align-top transition hover:bg-cream-50/60">
                  <td class="max-w-xs px-4 py-4">
                    <p class="line-clamp-2 break-words leading-6 text-ink-700">
                      {{ resena.comentario }}
                    </p>
                  </td>
                  <td class="px-4 py-4">
                    <app-star-rating [value]="resena.calificacion" size="sm" />
                  </td>
                  <td class="px-4 py-4 font-semibold text-ink-900">
                    {{ resena.nombreUsuario || 'Anónimo' }}
                  </td>
                  <td class="px-4 py-4">
                    <a
                      class="font-semibold text-brand-700 underline-offset-4 hover:underline"
                      [routerLink]="['/restaurantes', resena.restauranteId]"
                    >
                      {{ resena.nombreRestaurante }}
                    </a>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-end gap-2">
                      @if (confirmandoId() === resena.id) {
                        <span class="text-sm font-semibold text-ink-900">¿Eliminar?</span>
                        <button
                          type="button"
                          class="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-cream-100 disabled:opacity-60"
                          [id]="'cancelar-' + resena.id"
                          [disabled]="eliminandoId() === resena.id"
                          (click)="cancelar(resena.id)"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          class="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-progress disabled:opacity-60"
                          [disabled]="eliminandoId() === resena.id"
                          (click)="eliminar(resena.id)"
                        >
                          {{ eliminandoId() === resena.id ? 'Eliminando…' : 'Confirmar' }}
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-500 ring-1 ring-line transition hover:bg-red-50 hover:text-red-700 hover:ring-red-100"
                          [id]="'eliminar-' + resena.id"
                          [attr.aria-label]="
                            'Eliminar reseña de ' +
                            (resena.nombreUsuario || 'Anónimo') +
                            ' en ' +
                            resena.nombreRestaurante
                          "
                          (click)="pedirConfirmacion(resena.id)"
                        >
                          Eliminar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (cargando()) {
        <div class="mt-8" role="status" data-testid="moderacion-cargando">
          <span class="sr-only">Cargando reseñas…</span>
          <div
            class="space-y-4 rounded-2xl border border-line/60 bg-white p-6 shadow-sm"
            aria-hidden="true"
          >
            @for (item of skeletons; track item) {
              <div class="flex items-center gap-4 motion-safe:animate-pulse">
                <span class="block h-3 flex-1 rounded-full bg-cream-100"></span>
                <span class="block h-3 w-24 rounded-full bg-cream-100"></span>
                <span class="block h-3 w-20 rounded-full bg-cream-100"></span>
              </div>
            }
          </div>
        </div>
      } @else if (!error()) {
        <div
          class="mt-8 flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-white px-6 py-16 text-center shadow-sm"
        >
          <h2 class="text-lg font-bold text-ink-900">No hay reseñas para moderar</h2>
          <p class="mt-2 max-w-sm text-sm leading-6 text-ink-500">
            Cuando la comunidad publique reseñas nuevas van a aparecer acá.
          </p>
        </div>
      }
    </section>

    <app-toast-outlet />
  `,
})
export class ModeracionResenas {
  private readonly moderacion = inject(AdminModeracionService);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly resenas = this.moderacion.resenas;
  protected readonly cargando = this.moderacion.cargando;
  protected readonly error = this.moderacion.error;

  protected readonly confirmandoId = signal<number | null>(null);
  protected readonly eliminandoId = signal<number | null>(null);
  protected readonly skeletons = [1, 2, 3, 4, 5];

  constructor() {
    this.recargar();
  }

  protected recargar(): void {
    this.moderacion
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
    this.enfocar(`eliminar-${id}`);
  }

  protected eliminar(id: number): void {
    this.eliminandoId.set(id);
    this.moderacion
      .eliminar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.eliminandoId.set(null);
          this.confirmandoId.set(null);
          this.toasts.exito('Reseña eliminada.');
        },
        error: (error: Error) => {
          this.eliminandoId.set(null);
          this.toasts.error(error.message);
        },
      });
  }

  /** Keeps keyboard users in place when the row swaps its buttons. */
  private enfocar(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), {
      injector: this.injector,
    });
  }
}
