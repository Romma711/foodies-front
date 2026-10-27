import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FieldTree,
  FormField,
  FormRoot,
  TreeValidationResult,
  email,
  form,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { RegistroClienteRequest } from '../../models/user';
import { Auth } from '../../services/auth-service';

@Component({
  selector: 'app-register',
  imports: [FormField, FormRoot, RouterLink],
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly cargando = this.auth.cargando;
  readonly error = this.auth.error;

  private readonly modelo = signal<RegistroClienteRequest>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
  });

  readonly formulario = form(
    this.modelo,
    (registro) => {
      required(registro.nombre, { message: 'Ingresá tu nombre.' });
      minLength(registro.nombre, 2, { message: 'El nombre debe tener al menos 2 caracteres.' });
      required(registro.apellido, { message: 'Ingresá tu apellido.' });
      minLength(registro.apellido, 2, { message: 'El apellido debe tener al menos 2 caracteres.' });
      required(registro.email, { message: 'Ingresá tu email.' });
      email(registro.email, { message: 'Ingresá un email válido.' });
      required(registro.password, { message: 'Creá una contraseña.' });
      minLength(registro.password, 6, {
        message: 'La contraseña debe tener al menos 6 caracteres.',
      });
      maxLength(registro.password, 30, {
        message: 'La contraseña no puede superar los 30 caracteres.',
      });
      required(registro.telefono, { message: 'Ingresá tu teléfono.' });
      pattern(registro.telefono, /^\+?[\d\s-]{6,20}$/, {
        message: 'Ingresá un teléfono válido (solo números, espacios o guiones).',
      });
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
      await firstValueFrom(this.auth.registrar(this.modelo()));
      await this.router.navigate(['/login'], { queryParams: { registro: 'exitoso' } });
    } catch {
      // El error ya quedó expuesto en `auth.error()`.
    }
    return undefined;
  }

  private enfocarPrimerCampoInvalido(): void {
    for (const campo of [
      this.formulario.nombre,
      this.formulario.apellido,
      this.formulario.email,
      this.formulario.password,
      this.formulario.telefono,
    ]) {
      if (campo().invalid()) {
        campo().focusBoundControl();
        return;
      }
    }
  }
}
