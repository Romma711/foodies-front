import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClientePerfilService } from '../../services/cliente-perfil.service';

/** Datos de la cuenta del cliente y accesos a su actividad. */
@Component({
  selector: 'app-mi-perfil',
  imports: [RouterLink],
  template: `
    <main class="relative isolate overflow-hidden">
      <div
        class="pointer-events-none absolute inset-x-0 -top-48 -z-10 flex justify-center"
        aria-hidden="true"
      >
        <div class="h-96 w-[48rem] max-w-full rounded-full bg-brand-100/80 blur-3xl"></div>
      </div>

      <div class="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <header>
          <p class="text-xs font-bold tracking-[0.22em] text-brand-700 uppercase">Foodies</p>
          <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
            Mi perfil
          </h1>
        </header>

        @if (perfil(); as cuenta) {
          <section
            class="mt-8 rounded-2xl border border-line/70 bg-white/90 p-6 shadow-card sm:p-8"
            aria-labelledby="perfil-nombre"
          >
            <div class="flex items-center gap-4">
              <span
                class="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-700 text-2xl font-extrabold text-white"
                aria-hidden="true"
              >
                {{ inicial() }}
              </span>
              <div class="min-w-0">
                <h2
                  id="perfil-nombre"
                  class="truncate text-2xl font-extrabold tracking-tight text-ink-900"
                >
                  {{ nombreCompleto() }}
                </h2>
                <p class="text-sm text-ink-500">Cliente de Foodies</p>
              </div>
            </div>

            <dl class="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">Nombre</dt>
                <dd class="mt-1 font-semibold text-ink-900">{{ cuenta.nombre || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">Apellido</dt>
                <dd class="mt-1 font-semibold text-ink-900">{{ cuenta.apellido || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">Email</dt>
                <dd class="mt-1 font-semibold break-all text-ink-900">{{ cuenta.email }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">Teléfono</dt>
                <dd class="mt-1 font-semibold text-ink-900">
                  {{ cuenta.telefono || 'Sin teléfono' }}
                </dd>
              </div>
            </dl>
          </section>

          <nav class="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Mi actividad">
            <a
              routerLink="/mis-resenas"
              class="rounded-2xl border border-line/70 bg-white/90 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span class="block text-base font-bold text-ink-900">Mis reseñas</span>
              <span class="mt-1 block text-sm text-ink-500">
                Lo que opinaste de los restaurantes que visitaste.
              </span>
            </a>
            <a
              routerLink="/mis-reservas"
              class="rounded-2xl border border-line/70 bg-white/90 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span class="block text-base font-bold text-ink-900">Mis reservas</span>
              <span class="mt-1 block text-sm text-ink-500">
                El estado de tus mesas reservadas.
              </span>
            </a>
          </nav>
        } @else if (cargando()) {
          <p class="mt-8 text-sm font-medium text-ink-500" role="status">Cargando tu perfil…</p>
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
        }
      </div>
    </main>
  `,
})
export class MiPerfil {
  private readonly perfilService = inject(ClientePerfilService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly perfil = this.perfilService.perfil;
  protected readonly cargando = this.perfilService.cargando;
  protected readonly error = this.perfilService.error;
  protected readonly nombreCompleto = this.perfilService.nombreCompleto;

  constructor() {
    // Siempre se recarga: los datos del header pueden ser de antes de una edición.
    this.recargar();
  }

  protected inicial(): string {
    return this.nombreCompleto().trim().charAt(0).toUpperCase() || 'F';
  }

  protected recargar(): void {
    this.perfilService
      .cargar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
