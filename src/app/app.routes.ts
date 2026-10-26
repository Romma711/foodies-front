import { Routes } from '@angular/router';
import { Role } from './core/auth/auth.models';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';

const loadLogin = () => import('./pages/login/login').then((m) => m.Login);
const loadRegister = () => import('./pages/register/register').then((m) => m.Register);

const RESTAURANTE_DEMO_ID = 5;

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: `resenas/${RESTAURANTE_DEMO_ID}`,
  },
  {
    path: 'resenas/:restauranteId',
    title: 'Reseñas | Foodies',
    loadComponent: () =>
      import('./features/resenas/pages/resena-list/resena-list').then(
        (module) => module.ResenaList,
      ),
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
  {
    path: 'restaurante',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/restaurante/restaurante-home/restaurante-home').then(
        (m) => m.RestauranteHome,
      ),
    canMatch: [roleGuard('RESTAURANTE')],
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
  {
    path: 'admin',
    pathMatch: 'full',
    loadComponent: () => import('./pages/admin/admin-home/admin-home').then((m) => m.AdminHome),
    canMatch: [roleGuard('ADMIN')],
  },
  {
    path: 'admin/login',
    loadComponent: loadLogin,
    canMatch: [guestGuard],
    data: { role: 'ADMIN' satisfies Role },
  },
  { path: '**', redirectTo: '' },
];
