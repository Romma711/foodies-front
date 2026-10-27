import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { decodeJwt, extractRole } from '../../../core/auth/jwt';
import { PORTALS } from '../../../core/auth/portals';
import { loginRedirect } from '../../../core/auth/return-url';

/**
 * Lets the admin panel match only with a live admin session.
 *
 * `AuthService.token('ADMIN')` already drops missing or expired tokens; on top of that the guard
 * reads the JWT role claim, so a token stored under the admin key but issued for another role is
 * rejected too. Any rejected admin token is cleared before redirecting to the admin login.
 * The backend still authorizes every `/api/admin/**` call; this only protects the UI.
 */
export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const token = auth.token('ADMIN');
  const payload = token ? decodeJwt(token) : null;

  if (payload && extractRole(payload) === 'ADMIN') {
    return true;
  }
  auth.logout('ADMIN');
  return loginRedirect(inject(Router), PORTALS.ADMIN.loginPath);
};
