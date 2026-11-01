import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { Role } from './auth.models';
import { PortalNavigation } from './portal-navigation';

/**
 * En la app pública, `/restaurante/**` y `/admin/**` viven en el subdominio del dashboard:
 * este guard cruza de origen conservando la ruta (y la query) que se estaba pidiendo.
 */
export function irAlDashboardGuard(role: Role): CanActivateFn {
  return (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    void inject(PortalNavigation).irA(role, state.url);
    return false;
  };
}
