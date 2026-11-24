import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { email as emailValidator, form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LoginRequest,
  PendingApprovalError,
  Role,
  RoleMismatchError,
} from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { PORTALS } from '../../../core/auth/portals';
import { VolverAlInicio } from '../../../shared/ui/volver-al-inicio/volver-al-inicio';
import { PortalNavigation } from '../../../core/auth/portal-navigation';
import { safeReturnUrl } from '../../../core/auth/return-url';
import { isConnectionError } from '../../../core/http/api-error';
import { clave, Mensaje } from '@core/i18n/traducir';
import { TClavePipe, TPipe } from '@core/i18n/t.pipe';

@Component({
  imports: [TClavePipe, TPipe, FormField, RouterLink, VolverAlInicio],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly portals = inject(PortalNavigation);

  /** Bound from the route `data.role`. */
  readonly role = input.required<Role>();
  /** Bound from the `?returnUrl=` query param a guard adds when it sends the user here. */
  readonly returnUrl = input<string>();
  /** Bound from `?email=`, set when another portal of the ecosystem redirects the user here. */
  readonly email = input<string>();

  protected readonly portal = computed(() => PORTALS[this.role()]);
  private readonly destination = computed(
    () => safeReturnUrl(this.returnUrl()) ?? this.portal().homePath,
  );
  protected readonly errorMessage = signal<Mensaje | null>(null);

  private readonly model = signal<LoginRequest>({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: clave('auth.validacion.emailObligatorio') });
    emailValidator(path.email, { message: clave('auth.validacion.emailInvalido') });
    required(path.password, { message: clave('auth.validacion.contrasenaObligatoria') });
  });

  constructor() {
    effect(() => {
      const email = this.email();
      if (email) {
        this.model.update((modelo) => ({ ...modelo, email }));
      }
    });
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set(null);
    await submit(this.loginForm, async () => {
      try {
        await firstValueFrom(this.auth.login(this.model(), this.role()));
      } catch (error) {
        if (error instanceof RoleMismatchError && error.actual !== null) {
          // Credenciales válidas de otro portal: se manda al usuario al host que lo sirve,
          // con el email listo para que solo falte la contraseña.
          await this.portals.irA(error.actual, PORTALS[error.actual].loginPath, {
            email: this.model().email,
          });
          return undefined;
        }
        this.errorMessage.set(toMessage(error));
        return undefined;
      }
      // Navigation failures are routing problems, not login failures: the session is already stored.
      const destination = this.destination();
      await this.router.navigateByUrl(destination).catch((error: unknown) => {
        console.error(`Could not open ${destination} after login`, error);
      });
      return undefined;
    });
  }
}

function toMessage(error: unknown): Mensaje {
  if (error instanceof PendingApprovalError) {
    return { clave: 'auth.error.pendiente' };
  }
  if (error instanceof RoleMismatchError) {
    return { clave: 'auth.error.otroPortal' };
  }
  // An admin deactivated the account; only sent when the password was right (Phase 3).
  if (
    error instanceof HttpErrorResponse &&
    error.status === HttpStatusCode.Forbidden &&
    error.error?.error === 'cuenta dada de baja' &&
    typeof error.error?.mensaje === 'string'
  ) {
    return { texto: error.error.mensaje };
  }
  // The backend answers 400 for a wrong password.
  if (
    error instanceof HttpErrorResponse &&
    (error.status === HttpStatusCode.BadRequest ||
      error.status === HttpStatusCode.Unauthorized ||
      error.status === HttpStatusCode.Forbidden)
  ) {
    return { clave: 'auth.error.credenciales' };
  }
  if (isConnectionError(error)) {
    return { clave: 'comun.errorConexion' };
  }
  return { clave: 'comun.errorGenerico' };
}
