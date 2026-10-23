import { Routes } from '@angular/router';

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
    path: '',
    pathMatch: 'full',
    redirectTo: `resenas/${RESTAURANTE_DEMO_ID}`,
  },
  {
    path: '**',
    redirectTo: `resenas/${RESTAURANTE_DEMO_ID}`,
  },
];
