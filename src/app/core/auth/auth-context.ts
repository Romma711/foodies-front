import { HttpContext, HttpContextToken } from '@angular/common/http';
import { Role } from './auth.models';

/** Role whose token must be attached to the request. Requests without it go out anonymous. */
export const AUTH_ROLE = new HttpContextToken<Role | null>(() => null);

/** Usage: `http.get(url, { context: withRole('CLIENTE') })`. */
export function withRole(role: Role, context = new HttpContext()): HttpContext {
  return context.set(AUTH_ROLE, role);
}
