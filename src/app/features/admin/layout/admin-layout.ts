import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { PORTALS } from '../../../core/auth/portals';

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
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div
      class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-10"
    >
      <div
        class="flex items-center justify-between rounded-2xl border border-line/60 bg-white px-4 py-3 shadow-sm lg:hidden"
      >
        <p class="text-sm font-extrabold tracking-tight text-ink-900">Panel de administración</p>
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-cream-100"
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
        class="lg:block lg:w-64 lg:shrink-0"
        [class.hidden]="!menuAbierto()"
      >
        <div class="rounded-2xl border border-line/60 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <div class="flex items-center gap-3 px-3 pt-1">
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

          <nav class="mt-6" aria-label="Panel de administración">
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

          <div class="mt-6 border-t border-line/60 pt-4">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-red-50 hover:text-red-700"
              (click)="cerrarSesion()"
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
        </div>
      </aside>

      <div class="min-w-0 flex-1">
        <router-outlet />
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
      label: 'Moderación',
      path: '/admin/moderacion',
      exacto: false,
      icono: 'M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3ZM9 12l2 2 4-4',
    },
    {
      label: 'Solicitudes',
      path: '/admin/solicitudes',
      exacto: false,
      icono: 'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1ZM6 6h12v14H6zM9 12l2 2 4-4',
    },
    {
      label: 'Entidades',
      path: '/admin/entidades',
      exacto: false,
      icono:
        'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M22 20a6 6 0 0 0-5-5.9',
    },
  ];

  /** Only matters below `lg`; on desktop the sidebar is always visible. */
  protected readonly menuAbierto = signal(false);

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
