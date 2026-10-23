import { Routes } from '@angular/router';
import { Role } from './core/auth/auth.models';

const loadLogin = () => import('./pages/login/login').then((m) => m.Login);
const loadRegister = () => import('./pages/register/register').then((m) => m.Register);

export const routes: Routes = [
  { path: 'login', loadComponent: loadLogin, data: { role: 'CLIENTE' satisfies Role } },
  { path: 'register', loadComponent: loadRegister, data: { role: 'CLIENTE' satisfies Role } },
  {
    path: 'restaurante/login',
    loadComponent: loadLogin,
    data: { role: 'RESTAURANTE' satisfies Role },
  },
  {
    path: 'restaurante/register',
    loadComponent: loadRegister,
    data: { role: 'RESTAURANTE' satisfies Role },
  },
  { path: 'admin/login', loadComponent: loadLogin, data: { role: 'ADMIN' satisfies Role } },
  // Protect role areas with `canMatch: [roleGuard('ADMIN')]` from './core/auth/role.guard'.
];
