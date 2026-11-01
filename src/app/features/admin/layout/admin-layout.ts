import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { PORTALS } from '../../../core/auth/portals';
import { CuentaMenu } from '../../../shared/cuenta-menu/cuenta-menu';

interface AdminNavItem {
  label: string;
  path: string;
  /** Dashboard is the panel root, so it must match exactly or it would stay active everywhere. */
  exacto: boolean;
  /** SVG path data for a 24×24 outline icon. */
  icono: string;
}

@Component({
  selector: 'app-admin-layout',
  imports: [CuentaMenu, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-dvh lg:flex">
      <div
        class="sticky top-0 z-20 flex items-center justify-between border-b border-line/60 bg-white px-4 py-2 lg:hidden"
      >
        <p class="text-sm font-extrabold tracking-tight text-ink-900">Panel de administración</p>
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full text-ink-700 transition hover:bg-cream-100"
          aria-controls="admin-sidebar"
          [attr.aria-expanded]="menuAbierto()"
          [attr.aria-label]="menuAbierto() ? 'Cerrar menú del panel' : 'Abrir menú del panel'"
          (click)="alternarMenu()"
        >
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            @if (menuAbierto()) {
              <path d="M6 6l12 12M18 6 6 18" />
            } @else {
              <path d="M4 7h16M4 12h16M4 17h16" />
            }
          </svg>
        </button>
      </div>

      <aside
        id="admin-sidebar"
        class="flex flex-col gap-6 border-b border-line/60 bg-white p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-4 lg:py-6"
        [class.max-lg:hidden]="!menuAbierto()"
      >
        <div class="hidden items-center gap-3 px-3 lg:flex">
          <span
            class="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600"
            aria-hidden="true"
          >
            <svg
              class="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3Z" />
            </svg>
          </span>
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Foodies</p>
            <p class="text-sm font-extrabold tracking-tight text-ink-900">Administración</p>
          </div>
        </div>

        <nav aria-label="Panel de administración">
          <ul class="space-y-1">
            @for (item of navegacion; track item.path) {
              <li>
                <a
                  class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-cream-50 hover:text-ink-900"
                  [routerLink]="item.path"
                  routerLinkActive="bg-cream-100 !text-ink-900"
                  [routerLinkActiveOptions]="{ exact: item.exacto }"
                  ariaCurrentWhenActive="page"
                  (click)="cerrarMenu()"
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
                    <path [attr.d]="item.icono" />
                  </svg>
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </nav>

        <app-cuenta-menu [nombre]="nombre()" (cerrarSesion)="cerrarSesion()" />
      </aside>

      <div class="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div class="mx-auto w-full max-w-6xl">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly navegacion: readonly AdminNavItem[] = [
    {
      label: 'Dashboard',
      path: '/admin',
      exacto: true,
      icono: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
    },
    {
      label: 'Aceptar',
      path: '/admin/aceptar',
      exacto: false,
      icono: 'M3 21h18M5 21V8l7-5 7 5v13M9 13l2 2 4-4',
    },
    {
      label: 'Moderación',
      path: '/admin/moderacion',
      exacto: false,
      icono: 'M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3ZM9 12l2 2 4-4',
    },
  ];

  /** Only matters below `lg`; on desktop the sidebar is always visible. */
  protected readonly menuAbierto = signal(false);

  /** The admin has no display name: the sidebar shows the account email. */
  protected readonly nombre = computed(() => this.auth.subject('ADMIN') ?? 'Administrador');

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected cerrarSesion(): void {
    this.auth.logout('ADMIN');
    void this.router.navigateByUrl(PORTALS.ADMIN.loginPath);
  }
}
