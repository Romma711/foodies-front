import { Routes } from '@angular/router';
import { PanelLayout } from './layout/panel-layout/panel-layout';

export const panelRoutes: Routes = [
  {
    path: '',
    component: PanelLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Resumen · Foodies',
        loadComponent: () => import('./pages/resumen/resumen').then((m) => m.Resumen),
      },
      {
        path: 'perfil',
        title: 'Perfil · Foodies',
        loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
      },
      {
        path: 'carta',
        title: 'Carta · Foodies',
        loadComponent: () => import('./pages/carta/carta').then((m) => m.CartaPanel),
      },
      {
        path: 'espacios',
        title: 'Espacios · Foodies',
        loadComponent: () => import('./pages/espacios/espacios').then((m) => m.EspaciosPanel),
      },
      {
        path: 'horarios',
        title: 'Horarios · Foodies',
        loadComponent: () => import('./pages/horarios/horarios').then((m) => m.HorariosPanel),
      },
      {
        path: 'capacidad',
        title: 'Capacidad · Foodies',
        loadComponent: () =>
          import('./pages/cupos-especiales/cupos-especiales').then((m) => m.CuposEspeciales),
      },
      {
        path: 'fotos',
        title: 'Fotos · Foodies',
        loadComponent: () => import('./pages/fotos/fotos').then((m) => m.FotosPanel),
      },
      {
        path: 'reservas',
        title: 'Reservas · Foodies',
        loadComponent: () => import('./pages/reservas/reservas').then((m) => m.Reservas),
      },
    ],
  },
];
