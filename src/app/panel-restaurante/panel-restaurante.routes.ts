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
        title: 'titulo.panel.resumen',
        loadComponent: () => import('./pages/resumen/resumen').then((m) => m.Resumen),
      },
      {
        path: 'perfil',
        title: 'titulo.panel.perfil',
        loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
      },
      {
        path: 'carta',
        title: 'titulo.panel.carta',
        loadComponent: () => import('./pages/carta/carta').then((m) => m.CartaPanel),
      },
      {
        path: 'espacios',
        title: 'titulo.panel.espacios',
        loadComponent: () => import('./pages/espacios/espacios').then((m) => m.EspaciosPanel),
      },
      {
        path: 'horarios',
        title: 'titulo.panel.horarios',
        loadComponent: () => import('./pages/horarios/horarios').then((m) => m.HorariosPanel),
      },
      {
        path: 'turnos',
        title: 'titulo.panel.turnos',
        loadComponent: () => import('./pages/turnos/turnos').then((m) => m.TurnosPanel),
      },
      {
        path: 'capacidad',
        title: 'titulo.panel.capacidad',
        loadComponent: () =>
          import('./pages/cupos-especiales/cupos-especiales').then((m) => m.CuposEspeciales),
      },
      {
        path: 'fotos',
        title: 'titulo.panel.fotos',
        loadComponent: () => import('./pages/fotos/fotos').then((m) => m.FotosPanel),
      },
      {
        path: 'reservas',
        title: 'titulo.panel.reservas',
        loadComponent: () => import('./pages/reservas/reservas').then((m) => m.Reservas),
      },
    ],
  },
];
