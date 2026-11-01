import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Hostname real desde el que se sirve la app (sobreescribible en tests). */
export const HOSTNAME = new InjectionToken<string>('HOSTNAME', {
  factory: () => window.location.hostname,
});

/** URL base del host de la app pública (catálogo y portal de clientes). */
export const APP_URL = new InjectionToken<string>('APP_URL', {
  factory: () => environment.appUrl,
});

/** URL base del host del dashboard (paneles de restaurante y admin). */
export const DASHBOARD_URL = new InjectionToken<string>('DASHBOARD_URL', {
  factory: () => environment.dashboardUrl,
});

/** `window.location` reducido a lo que necesita el hard redirect entre hosts (testeable). */
export const BROWSER_LOCATION = new InjectionToken<Pick<Location, 'assign'>>('BROWSER_LOCATION', {
  factory: () => window.location,
});

/**
 * El dashboard se sirve en `dashboard.<dominio>`; en desarrollo, `dashboard.localhost:4200`
 * (los navegadores modernos resuelven `*.localhost` a 127.0.0.1 sin tocar `/etc/hosts`).
 */
export function esDashboardHost(hostname: string): boolean {
  return hostname.startsWith('dashboard.');
}
