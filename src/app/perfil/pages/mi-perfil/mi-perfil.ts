import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { isConnectionError, mensajeDelBackend } from '../../../core/http/api-error';
import { Mensaje } from '@core/i18n/traducir';
import { ClientePerfilService } from '../../services/cliente-perfil.service';
import { TPipe } from '@core/i18n/t.pipe';

/** Datos de la cuenta del cliente y accesos a su actividad. */
@Component({
  selector: 'app-mi-perfil',
  imports: [TPipe, RouterLink],
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
            {{ 'perfil.titulo' | t }}
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
                <p class="text-sm text-ink-500">{{ 'perfil.clienteDe' | t }}</p>
              </div>
            </div>

            <dl class="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">
                  {{ 'auth.registro.nombre' | t }}
                </dt>
                <dd class="mt-1 font-semibold text-ink-900">{{ cuenta.nombre || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">
                  {{ 'auth.registro.apellido' | t }}
                </dt>
                <dd class="mt-1 font-semibold text-ink-900">{{ cuenta.apellido || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">
                  {{ 'auth.email' | t }}
                </dt>
                <dd class="mt-1 font-semibold break-all text-ink-900">{{ cuenta.email }}</dd>
              </div>
              <div>
                <dt class="text-xs font-bold tracking-wide text-ink-500 uppercase">
                  {{ 'auth.registro.telefono' | t }}
                </dt>
                <dd class="mt-1 font-semibold text-ink-900">
                  {{ cuenta.telefono || ('perfil.sinTelefono' | t) }}
                </dd>
              </div>
            </dl>
          </section>

          <nav class="mt-6 grid gap-4 sm:grid-cols-2" [attr.aria-label]="'perfil.actividad' | t">
            <a
              routerLink="/mis-resenas"
              class="rounded-2xl border border-line/70 bg-white/90 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span class="block text-base font-bold text-ink-900">{{ 'nav.misResenas' | t }}</span>
              <span class="mt-1 block text-sm text-ink-500">
                {{ 'perfil.resenasTexto' | t }}
              </span>
            </a>
            <a
              routerLink="/mis-reservas"
              class="rounded-2xl border border-line/70 bg-white/90 p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span class="block text-base font-bold text-ink-900">{{
                'nav.misReservas' | t
              }}</span>
              <span class="mt-1 block text-sm text-ink-500">
                {{ 'perfil.reservasTexto' | t }}
              </span>
            </a>
          </nav>

          <section
            class="mt-10 rounded-2xl border border-red-100 bg-white/90 p-6 shadow-card"
            aria-labelledby="baja-titulo"
          >
            <h2 id="baja-titulo" class="text-lg font-extrabold tracking-tight text-ink-900">
              {{ 'perfil.baja.titulo' | t }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-ink-500">{{ 'perfil.baja.texto' | t }}</p>
            @if (errorBaja(); as mensaje) {
              <p
                role="alert"
                class="mt-4 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-800"
              >
                {{ mensaje | t }}
              </p>
            }
            @if (confirmandoBaja()) {
              <div
                class="mt-4 flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/60 p-4"
                role="group"
                [attr.aria-label]="'perfil.baja.confirmarAria' | t"
                data-testid="confirmar-baja"
              >
                <p class="text-sm font-semibold text-red-900">{{ 'perfil.baja.pregunta' | t }}</p>
                <p class="text-sm leading-6 text-red-900">{{ 'perfil.baja.consecuencias' | t }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    [disabled]="dandoDeBaja()"
                    class="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-red-900 ring-1 ring-red-200 transition hover:bg-red-100 disabled:opacity-60"
                    (click)="confirmandoBaja.set(false)"
                  >
                    {{ 'perfil.baja.mantener' | t }}
                  </button>
                  <button
                    type="button"
                    [disabled]="dandoDeBaja()"
                    class="inline-flex items-center justify-center rounded-full bg-red-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-900 disabled:cursor-progress disabled:opacity-60"
                    (click)="darDeBaja()"
                  >
                    {{ (dandoDeBaja() ? 'perfil.baja.procesando' : 'perfil.baja.confirmar') | t }}
                  </button>
                </div>
              </div>
            } @else {
              <button
                type="button"
                class="mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                (click)="iniciarBaja()"
              >
                {{ 'perfil.baja.boton' | t }}
              </button>
            }
          </section>
        } @else if (cargando()) {
          <p class="mt-8 text-sm font-medium text-ink-500" role="status">
            {{ 'perfil.cargando' | t }}
          </p>
        } @else if (error(); as mensaje) {
          <div
            class="mt-8 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p class="text-sm font-medium text-red-800">{{ mensaje | t }}</p>
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
              (click)="recargar()"
            >
              {{ 'comun.reintentar' | t }}
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
  private readonly router = inject(Router);

  /** In-page confirmation step of the account deactivation (no window.confirm). */
  protected readonly confirmandoBaja = signal(false);
  protected readonly dandoDeBaja = signal(false);
  protected readonly errorBaja = signal<Mensaje | null>(null);

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

  protected iniciarBaja(): void {
    this.errorBaja.set(null);
    this.confirmandoBaja.set(true);
  }

  protected darDeBaja(): void {
    this.dandoDeBaja.set(true);
    this.errorBaja.set(null);
    this.perfilService
      .darDeBaja()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.dandoDeBaja.set(false);
          void this.router.navigateByUrl('/');
        },
        error: (error: unknown) => {
          this.dandoDeBaja.set(false);
          this.errorBaja.set(
            mensajeDelBackend(error) ?? {
              clave: isConnectionError(error) ? 'comun.errorConexion' : 'perfil.baja.error',
            },
          );
        },
      });
  }

  protected recargar(): void {
    this.perfilService
      .cargar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
