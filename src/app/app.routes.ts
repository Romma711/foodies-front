import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

const RESTAURANTE_DEMO_ID = 5;

export const routes: Routes = [
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
    title: 'Ingresá | Foodies',
    loadComponent: () => import('./pages/login/login').then((module) => module.Login),
  },
  {
    path: 'register',
    title: 'Creá tu cuenta | Foodies',
    loadComponent: () => import('./pages/register/register').then((module) => module.Register),
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
    path: 'usuario/info',
    title: 'Mi perfil | Foodies',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/user-info/user-info').then((module) => module.UserInfo),
  },
  {
    path: 'usuario/reservas',
    title: 'Mis reservas | Foodies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reservas-list/reservas-list').then((module) => module.ReservasList),
  },
  { path: '', pathMatch: 'full', redirectTo: `resenas/${RESTAURANTE_DEMO_ID}` },
  { path: '**', redirectTo: `resenas/${RESTAURANTE_DEMO_ID}` },
];
