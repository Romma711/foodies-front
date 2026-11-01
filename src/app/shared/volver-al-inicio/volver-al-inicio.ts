import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortalNavigation } from '../../core/auth/portal-navigation';
import { PORTALS } from '../../core/auth/portals';

/**
 * "Volver al inicio" de las pantallas de login y registro. El inicio es el home de la app pública:
 * desde el dashboard es otro host, así que ahí el link es absoluto en vez de un `routerLink`
 * (que se quedaría en el dashboard y volvería al login).
 */
@Component({
  selector: 'app-volver-al-inicio',
  imports: [NgTemplateOutlet, RouterLink],
  host: { class: 'mb-6 block' },
  template: `
    @if (urlExterna; as url) {
      <a [href]="url" [class]="clases">
        <ng-container *ngTemplateOutlet="contenido" />
      </a>
    } @else {
      <a routerLink="/" [class]="clases">
        <ng-container *ngTemplateOutlet="contenido" />
      </a>
    }

    <ng-template #contenido>
      <svg
        class="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5m0 0 6 6m-6-6 6-6" />
      </svg>
      Volver al inicio
    </ng-template>
  `,
})
export class VolverAlInicio {
  private readonly portals = inject(PortalNavigation);

  protected readonly urlExterna = this.portals.esDashboard()
    ? this.portals.urlDe(PORTALS.CLIENTE, '/')
    : null;

  protected readonly clases =
    'inline-flex items-center gap-2 rounded-full text-sm font-semibold text-ink-500 transition hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700';
}
