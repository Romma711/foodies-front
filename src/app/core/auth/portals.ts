import { Role } from './auth.models';

/** Host que sirve un portal: la app pública o el subdominio del dashboard. */
export type PortalHost = 'app' | 'dashboard';

export interface Portal {
  loginPath: string;
  homePath: string;
  registerPath: string | null;
  title: string;
  /** Los paneles de restaurante y admin se sirven en `dashboard.<dominio>`. */
  host: PortalHost;
}

export const PORTALS: Record<Role, Portal> = {
  CLIENTE: {
    loginPath: '/login',
    homePath: '/',
    registerPath: '/register',
    title: 'Cliente',
    host: 'app',
  },
  RESTAURANTE: {
    loginPath: '/restaurante/login',
    homePath: '/restaurante',
    registerPath: '/restaurante/register',
    title: 'Restaurante',
    host: 'dashboard',
  },
  ADMIN: {
    loginPath: '/admin/login',
    homePath: '/admin',
    registerPath: null,
    title: 'Admin',
    host: 'dashboard',
  },
};
