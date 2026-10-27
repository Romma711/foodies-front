import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  LoginRequest,
  PendingApprovalError,
  Role,
  RoleMismatchError,
} from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { PORTALS } from '../../core/auth/portals';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-login',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the route `data.role`. */
  readonly role = input.required<Role>();

  protected readonly portal = computed(() => PORTALS[this.role()]);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly model = signal<LoginRequest>({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'El email es obligatorio.' });
    email(path.email, { message: 'Ingresá un email válido.' });
    required(path.password, { message: 'La contraseña es obligatoria.' });
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set(null);
    await submit(this.loginForm, async () => {
      try {
        await firstValueFrom(this.auth.login(this.model(), this.role()));
      } catch (error) {
        this.errorMessage.set(toMessage(error));
        return undefined;
      }
      // Navigation failures are routing problems, not login failures: the session is already stored.
      await this.router.navigateByUrl(this.portal().homePath).catch((error: unknown) => {
        console.error(`Could not open ${this.portal().homePath} after login`, error);
      });
      return undefined;
    });
  }
}

function toMessage(error: unknown): string {
  if (error instanceof PendingApprovalError) {
    return 'Tu restaurante está pendiente de aprobación. Podrás ingresar cuando un administrador lo apruebe.';
  }
  if (error instanceof RoleMismatchError) {
    return 'Esta cuenta no pertenece a este portal.';
  }
  // The backend answers 400 for a wrong password.
  if (
    error instanceof HttpErrorResponse &&
    (error.status === HttpStatusCode.BadRequest ||
      error.status === HttpStatusCode.Unauthorized ||
      error.status === HttpStatusCode.Forbidden)
  ) {
    return 'Email o contraseña incorrectos.';
  }
  return 'Algo salió mal. Intentá de nuevo.';
}
