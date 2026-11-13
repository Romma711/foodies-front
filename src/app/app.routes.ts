import { Routes } from '@angular/router';
import { Role } from './core/auth/auth.models';
import { guestGuard } from './core/auth/guest.guard';
import { irAlDashboardGuard } from './core/auth/ir-al-dashboard.guard';
import { roleGuard } from './core/auth/role.guard';
import { esDashboardHost } from './core/config/host.config';
import { adminGuard } from './admin/guards/admin.guard';

const loadLogin = () => import('./auth/pages/login/login').then((m) => m.Login);
const loadRegister = () => import('./auth/pages/register/register').then((m) => m.Register);

/**
 * Rutas de la app pública, servida en el host principal (`localhost:4200` en desarrollo):
 * catálogo de restaurantes, reservas del cliente y el portal de login/registro de clientes.
 */
export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Foodies',
    loadComponent: () => import('./home/pages/home/home').then((module) => module.Home),
  },
  {
    path: 'restaurantes',
    title: 'Restaurantes | Foodies',
    loadComponent: () =>
      import('./restaurantes/pages/restaurante-list/restaurante-list').then(
        (module) => module.RestauranteList,
      ),
  },
  {
    path: 'restaurantes/:restauranteId',
    title: 'Restaurante | Foodies',
    loadComponent: () =>
      import('./restaurantes/pages/restaurante-detail/restaurante-detail').then(
        (module) => module.RestauranteDetail,
      ),
  },
  {
    path: 'mis-reservas',
    title: 'Mis reservas | Foodies',
    loadComponent: () =>
      import('./reservas/pages/mis-reservas/mis-reservas').then(
        (module) => module.MisReservas,
      ),
    canMatch: [roleGuard('CLIENTE')],
  },
  {
    path: 'perfil',
    title: 'Mi perfil | Foodies',
    loadComponent: () =>
      import('./perfil/pages/mi-perfil/mi-perfil').then((module) => module.MiPerfil),
    canMatch: [roleGuard('CLIENTE')],
  },
  {
    path: 'mis-resenas',
    title: 'Mis reseñas | Foodies',
    loadComponent: () =>
      import('./resenas/pages/mis-resenas/mis-resenas').then(
        (module) => module.MisResenas,
      ),
    canMatch: [roleGuard('CLIENTE')],
  },
  {
    // Reviews live inside the restaurant page now; keep old links working.
    path: 'resenas/:restauranteId',
    redirectTo: 'restaurantes/:restauranteId',
  },
  {
    path: 'login',
    loadComponent: loadLogin,
    canMatch: [guestGuard],
    data: { role: 'CLIENTE' satisfies Role },
  },
  {
    path: 'register',
    loadComponent: loadRegister,
    canMatch: [guestGuard],
    data: { role: 'CLIENTE' satisfies Role },
  },
  // Los paneles viven en el subdominio del dashboard: desde la app pública cualquier
  // intento de entrar cruza de origen conservando la ruta pedida. El hijo `**` necesita
  // `children: []`: el router rechaza (NG04014) una ruta sin componente, hijos ni redirect.
  {
    path: 'restaurante',
    canActivate: [irAlDashboardGuard('RESTAURANTE')],
    children: [{ path: '**', children: [] }],
  },
  {
    path: 'admin',
    canActivate: [irAlDashboardGuard('ADMIN')],
    children: [{ path: '**', children: [] }],
  },
  { path: '**', redirectTo: '' },
];

/**
 * Rutas del dashboard, servidas en `dashboard.<dominio>` (`dashboard.localhost:4200` en
 * desarrollo): el panel del restaurante y el de admin, cada uno con su propio login.
 */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'restaurante',
  },
  {
    path: 'restaurante/login',
    loadComponent: loadLogin,
    canMatch: [guestGuard],
    data: { role: 'RESTAURANTE' satisfies Role },
  },
  {
    path: 'restaurante/register',
    loadComponent: loadRegister,
    canMatch: [guestGuard],
    data: { role: 'RESTAURANTE' satisfies Role },
  },
  // Login/register must come before the panel: its roleGuard would redirect them to the login again.
  {
    path: 'restaurante',
    canMatch: [roleGuard('RESTAURANTE')],
    loadChildren: () => import('./panel-restaurante/panel-restaurante.routes').then((m) => m.panelRoutes),
  },
  {
    path: 'admin/login',
    loadComponent: loadLogin,
    canMatch: [guestGuard],
    data: { role: 'ADMIN' satisfies Role },
  },
  {
    // The admin routes match every `/admin/...` URL, so the login goes first.
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canMatch: [adminGuard],
  },
  { path: '**', redirectTo: '' },
];

/** Cada host sirve su propio juego de rutas. */
export function rutasParaHostname(hostname: string): Routes {
  return esDashboardHost(hostname) ? DASHBOARD_ROUTES : APP_ROUTES;
}

export const routes: Routes = rutasParaHostname(window.location.hostname);
