import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(Auth);

  const token = localStorage.getItem('token');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  return authService.validarToken().pipe(
    map(() => true),
    catchError(() => {
      localStorage.removeItem('token');
      return of(router.createUrlTree(['/login']));
    })
  );
};