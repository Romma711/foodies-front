import { Clave } from '../i18n/traducir';
import { Role } from './auth.models';

/** Host que sirve un portal: la app pública o el subdominio del dashboard. */
export type PortalHost = 'app' | 'dashboard';

export interface Portal {
  loginPath: string;
  homePath: string;
  registerPath: string | null;
  /** Translation key of the portal name. */
  title: Clave;
  /** Los paneles de restaurante y admin se sirven en `dashboard.<dominio>`. */
  host: PortalHost;
}

export const PORTALS: Record<Role, Portal> = {
  CLIENTE: {
    loginPath: '/login',
    homePath: '/',
    registerPath: '/register',
    title: 'portal.cliente',
    host: 'app',
  },
  RESTAURANTE: {
    loginPath: '/restaurante/login',
    homePath: '/restaurante',
    registerPath: '/restaurante/register',
    title: 'portal.restaurante',
    host: 'dashboard',
  },
  ADMIN: {
    loginPath: '/admin/login',
    homePath: '/admin',
    registerPath: null,
    title: 'portal.admin',
    host: 'dashboard',
  },
};
