import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Role, ROLES } from './auth.models';
import { AuthService } from './auth.service';
import { PORTALS } from './portals';

/** For login/register routes: a user already signed in to the route's `data.role` goes to that portal's home. */
export const guestGuard: CanMatchFn = (route) => {
  const role = route.data?.['role'];
  if (!isRole(role) || !inject(AuthService).isAuthenticated(role)) {
    return true;
  }
  return inject(Router).parseUrl(PORTALS[role].homePath);
};

function isRole(value: unknown): value is Role {
  return ROLES.some((role) => role === value);
}
