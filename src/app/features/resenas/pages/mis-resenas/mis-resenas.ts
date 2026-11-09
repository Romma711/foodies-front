import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { StarRating } from '../../components/star-rating/star-rating';
import { ResenaService } from '../../services/resena.service';
import { formatearFechaResena } from '../../utils/fecha-resena';

/** Reseñas que escribió el cliente, cada una con el restaurante al que corresponde. */
@Component({
  selector: 'app-mis-resenas',
  imports: [RouterLink, StarRating],
  template: `
    <main class="relative isolate overflow-hidden">
      <div
        class="pointer-events-none absolute inset-x-0 -top-48 -z-10 flex justify-center"
        aria-hidden="true"
      >
        <div class="h-96 w-[48rem] max-w-full rounded-full bg-brand-100/80 blur-3xl"></div>
      </div>

      <div class="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <header class="max-w-xl">
          <p class="text-xs font-bold tracking-[0.22em] text-brand-700 uppercase">Foodies</p>
          <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            Mis reseñas
          </h1>
          <p class="mt-3 text-base leading-7 text-ink-500 sm:text-lg">
            Lo que opinaste de los restaurantes que visitaste.
          </p>
        </header>

        @if (cargando()) {
          <p class="mt-8 text-sm font-medium text-ink-500" role="status">Cargando tus reseñas…</p>
        } @else if (error(); as mensaje) {
          <div
            class="mt-8 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
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
        } @else if (resenas().length === 0) {
          <div
            class="mt-8 flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-white/80 px-6 py-16 text-center shadow-card"
          >
            <h2 class="text-lg font-bold text-ink-900">Todavía no escribiste reseñas</h2>
            <p class="mt-2 max-w-sm text-sm leading-6 text-ink-500">
              Después de visitar un restaurante, contá cómo te fue desde su página.
            </p>
            <a
              routerLink="/restaurantes"
              class="mt-5 inline-flex items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700"
            >
              Ver restaurantes
            </a>
          </div>
        } @else {
          <ul class="mt-8 grid gap-4">
            @for (resena of resenas(); track resena.id) {
              <li class="rounded-2xl border border-line/70 bg-white/90 p-5 shadow-card sm:p-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h2 class="text-lg font-bold text-ink-900">
                    <a
                      [routerLink]="['/restaurantes', resena.restauranteId]"
                      class="underline-offset-4 hover:text-brand-700 hover:underline"
                    >
                      {{ resena.nombreRestaurante }}
                    </a>
                  </h2>
                  <app-star-rating [value]="resena.calificacion" size="sm" [mostrarValor]="true" />
                </div>
                @if (formatearFecha(resena.fecha); as fecha) {
                  <time class="mt-1 block text-xs text-ink-700" [attr.datetime]="resena.fecha">
                    {{ fecha }}
                  </time>
                }
                <p class="mt-3 leading-7 break-words text-ink-700">{{ resena.comentario }}</p>
              </li>
            }
          </ul>
        }
      </div>
    </main>
  `,
})
export class MisResenas {
  private readonly auth = inject(AuthService);
  private readonly resenaService = inject(ResenaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly resenas = this.resenaService.misResenas;
  protected readonly formatearFecha = formatearFechaResena;
  protected readonly cargando = this.resenaService.loading;
  protected readonly error = this.resenaService.error;

  constructor() {
    this.recargar();
  }

  protected recargar(): void {
    const usuarioId = this.auth.userId('CLIENTE');
    if (usuarioId === null) {
      return;
    }
    this.resenaService
      .listarPorUsuario(usuarioId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
