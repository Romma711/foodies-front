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
        title: 'Resumen · Foodies',
        loadComponent: () => import('./resumen/resumen').then((m) => m.Resumen),
      },
      {
        path: 'perfil',
        title: 'Perfil · Foodies',
        loadComponent: () => import('./perfil/perfil').then((m) => m.Perfil),
      },
      {
        path: 'carta',
        title: 'Carta · Foodies',
        loadComponent: () => import('./carta/carta').then((m) => m.CartaPanel),
      },
      {
        path: 'capacidad',
        title: 'Capacidad · Foodies',
        loadComponent: () =>
          import('./cupos-especiales/cupos-especiales').then((m) => m.CuposEspeciales),
      },
      {
        path: 'fotos',
        title: 'Fotos · Foodies',
        loadComponent: () => import('./fotos/fotos').then((m) => m.FotosPanel),
      },
      {
        path: 'reservas',
        title: 'Reservas · Foodies',
        loadComponent: () => import('./reservas/reservas').then((m) => m.Reservas),
      },
    ],
  },
];
