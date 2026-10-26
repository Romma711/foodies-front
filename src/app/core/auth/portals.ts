import { Role } from './auth.models';

export interface Portal {
  loginPath: string;
  homePath: string;
  registerPath: string | null;
  title: string;
}

export const PORTALS: Record<Role, Portal> = {
  CLIENTE: {
    loginPath: '/login',
    homePath: '/',
    registerPath: '/register',
    title: 'Cliente',
  },
  RESTAURANTE: {
    loginPath: '/restaurante/login',
    homePath: '/restaurante',
    registerPath: '/restaurante/register',
    title: 'Restaurante',
  },
  ADMIN: {
    loginPath: '/admin/login',
    homePath: '/admin',
    registerPath: null,
    title: 'Admin',
  },
};
