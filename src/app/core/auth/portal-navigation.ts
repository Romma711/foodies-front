import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import {
  APP_URL,
  BROWSER_LOCATION,
  DASHBOARD_URL,
  HOSTNAME,
  esDashboardHost,
} from '../config/host.config';
import { Role } from './auth.models';
import { PORTALS, Portal, PortalHost } from './portals';

/** Query params opcionales; los vacíos se descartan. */
export type QueryParams = Record<string, string | null | undefined>;

/**
 * Navegación entre los portales del ecosistema.
 *
 * `localStorage` es por-origen: la app pública y el dashboard no comparten sesión, así que
 * cruzar de host es siempre un hard redirect hacia el login del portal de destino (con el
 * email precargado, para que solo falte la contraseña).
 */
@Service()
export class PortalNavigation {
  private readonly router = inject(Router);
  private readonly location = inject(BROWSER_LOCATION);
  private readonly hostname = inject(HOSTNAME);
  private readonly appUrl = inject(APP_URL);
  private readonly dashboardUrl = inject(DASHBOARD_URL);

  /** Host desde el que se sirve la app: la app pública o el subdominio del dashboard. */
  readonly hostActual: PortalHost = esDashboardHost(this.hostname) ? 'dashboard' : 'app';

  esDashboard(): boolean {
    return this.hostActual === 'dashboard';
  }

  /** URL absoluta de un destino dentro del host que sirve el portal. */
  urlDe(portal: Portal, destino: string, query: QueryParams = {}): string {
    const base = portal.host === 'dashboard' ? this.dashboardUrl : this.appUrl;
    return `${base}${destino}${serializarQuery(query)}`;
  }

  /** Lleva a un destino del portal de un rol: in-app si coincide el host, hard redirect si no. */
  async irA(role: Role, destino: string, query: QueryParams = {}): Promise<void> {
    const portal = PORTALS[role];
    if (portal.host !== this.hostActual) {
      this.location.assign(this.urlDe(portal, destino, query));
      return;
    }
    const tree = this.router.parseUrl(destino);
    for (const [clave, valor] of Object.entries(query)) {
      if (valor) {
        tree.queryParams[clave] = valor;
      }
    }
    await this.router.navigateByUrl(tree);
  }
}

function serializarQuery(query: QueryParams): string {
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(query)) {
    if (valor) {
      params.set(clave, valor);
    }
  }
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}
