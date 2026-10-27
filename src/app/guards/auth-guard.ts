import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth-service';

/**
 * Protege rutas privadas verificando localmente que exista un token vigente.
 * Si el token resulta inválido para el backend, el interceptor cierra la sesión (401).
 */
export const authGuard: CanActivateFn = (ruta) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true;
  }

  // Guardamos a dónde quería entrar el usuario para volver ahí después del login.
  const returnUrl = `/${ruta.url.map((segmento) => segmento.path).join('/')}`;
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
