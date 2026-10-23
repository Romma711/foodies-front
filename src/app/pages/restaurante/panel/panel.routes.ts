import { Routes } from '@angular/router';
import { PanelLayout } from './panel-layout/panel-layout';

export const panelRoutes: Routes = [
  {
    path: '',
    component: PanelLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Overview · Foodies',
        loadComponent: () => import('./resumen/resumen').then((m) => m.Resumen),
      },
      {
        path: 'perfil',
        title: 'Profile · Foodies',
        loadComponent: () => import('./perfil/perfil').then((m) => m.Perfil),
      },
      {
        path: 'carta',
        title: 'Menu · Foodies',
        loadComponent: () => import('./carta/carta').then((m) => m.CartaPanel),
      },
      {
        path: 'reservas',
        title: 'Reservations · Foodies',
        loadComponent: () => import('./reservas/reservas').then((m) => m.Reservas),
      },
    ],
  },
];
