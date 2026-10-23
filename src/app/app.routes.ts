import { Routes } from '@angular/router';
import { Role } from './core/auth/auth.models';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';

const loadLogin = () => import('./pages/login/login').then((m) => m.Login);
const loadRegister = () => import('./pages/register/register').then((m) => m.Register);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
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
