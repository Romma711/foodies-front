import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { ClientePerfilService } from '../../../../perfil/services/cliente-perfil.service';

/**
 * Cuenta del cliente en el header: su nombre y, al tocarlo, un popup con su perfil, sus reseñas,
 * sus reservas y "Cerrar sesión". Se cierra con Escape (devolviendo el foco) o con un clic afuera.
 */
@Component({
  selector: 'app-cliente-menu',
  imports: [RouterLink],
  host: {
    class: 'relative',
    '(document:click)': 'cerrarSiEsAfuera($event)',
    '(document:keydown.escape)': 'cerrarConEscape()',
  },
  template: `
    <button
      #boton
      type="button"
      class="inline-flex max-w-56 items-center gap-2 rounded-full border border-line bg-white/75 py-1 pr-2 pl-1 text-sm font-semibold text-ink-700 transition hover:bg-white hover:text-ink-900"
      aria-controls="cliente-menu"
      [attr.aria-expanded]="abierto()"
      (click)="alternar()"
    >
      <span
        class="grid size-7 shrink-0 place-items-center rounded-full bg-brand-700 text-xs font-extrabold text-white"
        aria-hidden="true"
      >
        {{ inicial() }}
      </span>
      <span class="truncate">{{ perfil.nombreVisible() }}</span>
      <svg
        class="size-4 shrink-0 text-ink-500 transition"
        [class.rotate-180]="abierto()"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Siempre en el DOM: \`aria-controls\` tiene que apuntar a un id que exista. -->
    <div
      id="cliente-menu"
      class="absolute top-full right-0 z-50 mt-2 w-64 rounded-2xl border border-line/70 bg-white p-2 shadow-soft"
      [hidden]="!abierto()"
    >
      <div class="border-b border-line/70 px-3 pt-2 pb-3">
        <p class="truncate text-sm font-bold text-ink-900">{{ perfil.nombreCompleto() }}</p>
        @if (email(); as email) {
          <p class="truncate text-xs text-ink-500">{{ email }}</p>
        }
      </div>
      <ul class="py-1">
        @for (opcion of opciones; track opcion.path) {
          <li>
            <a
              [routerLink]="opcion.path"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-cream-100 hover:text-ink-900"
              (click)="cerrar()"
            >
              <svg
                class="size-5 shrink-0 text-ink-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path [attr.d]="opcion.icono" />
              </svg>
              {{ opcion.label }}
            </a>
          </li>
        }
      </ul>
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-xl border-t border-line/70 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        (click)="salir()"
      >
        <svg
          class="size-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3" />
        </svg>
        Cerrar sesión
      </button>
    </div>
  `,
})
export class ClienteMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthService);
  protected readonly perfil = inject(ClientePerfilService);

  readonly cerrarSesion = output<void>();

  private readonly boton = viewChild.required<ElementRef<HTMLButtonElement>>('boton');

  protected readonly abierto = signal(false);
  protected readonly email = computed(() => this.auth.subject('CLIENTE'));
  protected readonly inicial = computed(
    () => this.perfil.nombreVisible().trim().charAt(0).toUpperCase() || 'F',
  );

  protected readonly opciones = [
    {
      path: '/perfil',
      label: 'Mi perfil',
      icono: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
    },
    {
      path: '/mis-resenas',
      label: 'Mis reseñas',
      icono: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z',
    },
    {
      path: '/mis-reservas',
      label: 'Mis reservas',
      icono: 'M5 5h14v15H5V5Zm0 5h14M9 3v4m6-4v4',
    },
  ];

  constructor() {
    if (this.perfil.perfil() === null) {
      // Si falla, el botón muestra el email de la sesión; "Mi perfil" informa el error.
      this.perfil.cargar().subscribe({ error: () => undefined });
    }
  }

  protected alternar(): void {
    this.abierto.update((abierto) => !abierto);
    if (this.abierto()) {
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('#cliente-menu a')?.focus(),
        { injector: this.injector },
      );
    }
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected salir(): void {
    this.abierto.set(false);
    this.cerrarSesion.emit();
  }

  protected cerrarSiEsAfuera(event: MouseEvent): void {
    if (this.abierto() && !this.host.nativeElement.contains(event.target as Node)) {
      this.abierto.set(false);
    }
  }

  protected cerrarConEscape(): void {
    if (this.abierto()) {
      this.abierto.set(false);
      this.boton().nativeElement.focus();
    }
  }
}
