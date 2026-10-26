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
        title: 'Dashboard | Admin Foodies',
        loadComponent: () =>
          import('./pages/dashboard-admin/dashboard-admin').then((m) => m.DashboardAdmin),
      },
      {
        path: 'moderacion',
        title: 'Moderación | Admin Foodies',
        loadComponent: () =>
          import('./pages/moderacion-resenas/moderacion-resenas').then((m) => m.ModeracionResenas),
      },
    ],
  },
];
