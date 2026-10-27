import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FieldTree,
  FormField,
  FormRoot,
  TreeValidationResult,
  email,
  form,
  required,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { LoginRequest } from '../../models/user';
import { Auth } from '../../services/auth-service';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot, RouterLink],
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Aviso de registro exitoso, enviado como query param desde la página de registro. */
  readonly avisoRegistro = this.route.snapshot.queryParamMap.get('registro') === 'exitoso';
  readonly cargando = this.auth.cargando;
  readonly error = this.auth.error;

  private readonly modelo = signal<LoginRequest>({ email: '', password: '' });

  readonly formulario = form(
    this.modelo,
    (login) => {
      required(login.email, { message: 'Ingresá tu email.' });
      email(login.email, { message: 'Ingresá un email válido.' });
      required(login.password, { message: 'Ingresá tu contraseña.' });
    },
    {
      submission: {
        action: () => this.enviar(),
        onInvalid: () => this.enfocarPrimerCampoInvalido(),
      },
    },
  );

  /** El error de un campo se muestra recién cuando el usuario lo tocó o intentó enviar. */
  mostrarError(campo: FieldTree<string>): boolean {
    return campo().invalid() && campo().touched();
  }

  mensajeDeError(campo: FieldTree<string>): string | null {
    return campo().errors()[0]?.message ?? null;
  }

  private async enviar(): Promise<TreeValidationResult> {
    try {
      await firstValueFrom(this.auth.iniciarSesion(this.modelo()));
      await this.router.navigateByUrl(this.destinoPostLogin());
    } catch {
      // El error ya quedó expuesto en `auth.error()`.
    }
    return undefined;
  }

  /** Vuelve a la ruta que intentaba acceder (returnUrl) o al perfil por defecto. */
  private destinoPostLogin(): string {
    const retorno = this.route.snapshot.queryParamMap.get('returnUrl');
    const esRutaLocal = retorno !== null && retorno.startsWith('/') && !retorno.startsWith('//');
    return esRutaLocal ? retorno : '/usuario/info';
  }

  private enfocarPrimerCampoInvalido(): void {
    for (const campo of [this.formulario.email, this.formulario.password]) {
      if (campo().invalid()) {
        campo().focusBoundControl();
        return;
      }
    }
  }
}
