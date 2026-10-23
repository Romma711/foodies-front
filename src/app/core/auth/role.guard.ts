import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Role } from './auth.models';
import { AuthService } from './auth.service';
import { PORTALS } from './portals';

/** Lets the route match only with a valid session for `role`; otherwise redirects to that role's login. */
export function roleGuard(role: Role): CanMatchFn {
  return () =>
    inject(AuthService).isAuthenticated(role) || inject(Router).parseUrl(PORTALS[role].loginPath);
}
