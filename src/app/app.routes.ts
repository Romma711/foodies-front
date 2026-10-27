import { Routes } from '@angular/router';
import { Role } from './core/auth/auth.models';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';
import { adminGuard } from './features/admin/guards/admin.guard';

const loadLogin = () => import('./pages/login/login').then((m) => m.Login);
const loadRegister = () => import('./pages/register/register').then((m) => m.Register);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'restaurantes',
  },
  {
    path: 'restaurantes',
    title: 'Restaurantes | Foodies',
    loadComponent: () =>
      import('./pages/restaurante/restaurante-list/restaurante-list').then(
        (module) => module.RestauranteList,
      ),
  },
  {
    path: 'restaurantes/:restauranteId',
    title: 'Restaurante | Foodies',
    loadComponent: () =>
      import('./pages/restaurante/restaurante-detail/restaurante-detail').then(
        (module) => module.RestauranteDetail,
      ),
  },
  {
    path: 'mis-reservas',
    title: 'Mis reservas | Foodies',
    loadComponent: () =>
      import('./features/reservas/pages/mis-reservas/mis-reservas').then(
        (module) => module.MisReservas,
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
  // Login/register must come before the panel: its roleGuard would redirect them to the login again.
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
  {
    path: 'restaurante',
    canMatch: [roleGuard('RESTAURANTE')],
    loadChildren: () => import('./pages/restaurante/panel/panel.routes').then((m) => m.panelRoutes),
  },
  // Login goes first: the panel route below matches every `/admin/...` URL.
  {
    path: 'admin/login',
    loadComponent: loadLogin,
    canMatch: [guestGuard],
    data: { role: 'ADMIN' satisfies Role },
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canMatch: [adminGuard],
  },
  { path: '**', redirectTo: '' },
];
