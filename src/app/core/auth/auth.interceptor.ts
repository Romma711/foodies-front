import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AUTH_ROLE } from './auth-context';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const role = req.context.get(AUTH_ROLE);
  if (!role) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.token(role);
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized) {
        auth.logout(role);
      }
      return throwError(() => error);
    }),
  );
};
