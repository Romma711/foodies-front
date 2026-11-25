import { Routes } from '@angular/router';
import { AdminLayout } from './layout/admin-layout';

/**
 * Admin panel children, loaded lazily under `/admin` behind `adminGuard`.
 * Every page renders inside the layout's sidebar shell.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        title: 'titulo.admin.dashboard',
        loadComponent: () =>
          import('./pages/dashboard-admin/dashboard-admin').then((m) => m.DashboardAdmin),
      },
      {
        path: 'aceptar',
        title: 'titulo.admin.aceptar',
        loadComponent: () =>
          import('./pages/solicitudes-restaurantes/solicitudes-restaurantes').then(
            (m) => m.SolicitudesRestaurantes,
          ),
      },
      {
        path: 'aceptar/:restaurantId',
        title: 'titulo.admin.solicitud',
        loadComponent: () =>
          import('./pages/detalle-solicitud/detalle-solicitud').then((m) => m.DetalleSolicitud),
      },
      {
        path: 'moderacion',
        title: 'titulo.admin.moderacion',
        loadComponent: () =>
          import('./pages/moderacion-resenas/moderacion-resenas').then((m) => m.ModeracionResenas),
      },
      { path: 'solicitudes', redirectTo: 'aceptar', pathMatch: 'full' },
      {
        path: 'entidades',
        title: 'titulo.admin.entidades',
        loadComponent: () =>
          import('./pages/gestion-entidades/gestion-entidades').then((m) => m.GestionEntidades),
      },
    ],
  },
];
