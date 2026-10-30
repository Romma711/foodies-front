import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  min,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { EspecialidadDeComida, ESPECIALIDADES, RegistrableRole } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { PORTALS } from '../../core/auth/portals';
import { ESPECIALIDAD_LABELS } from '../../core/catalog/especialidades';
import { errorDeFotosRegistro } from '../../core/catalog/fotos';
import {
  backendMessage,
  CONNECTION_ERROR_MESSAGE,
  isConnectionError,
} from '../../core/http/api-error';
import { RegistroFotos } from './registro-fotos/registro-fotos';

interface RegisterFormModel {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  nombreRestaurante: string;
  direccion: string;
  especialidadDeComida: EspecialidadDeComida | '';
  cupoMaximo: number;
}

@Component({
  imports: [FormField, RegistroFotos, RouterLink],
  selector: 'app-register',
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the route `data.role`. ADMIN accounts are never created from the front. */
  readonly role = input.required<RegistrableRole>();

  protected readonly portal = computed(() => PORTALS[this.role()]);
  protected readonly isRestaurante = computed(() => this.role() === 'RESTAURANTE');
  protected readonly especialidades = ESPECIALIDADES;
  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  protected readonly errorMessage = signal<string | null>(null);
  /** Restaurant requests need admin approval, so they stay here with a confirmation. */
  protected readonly pendingApproval = signal(false);
  protected readonly fotos = signal<File[]>([]);
  protected readonly portada = signal(0);
  /** Los errores de las fotos aparecen después del primer intento de enviar. */
  protected readonly intentoEnviar = signal(false);

  private readonly model = signal<RegisterFormModel>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    nombreRestaurante: '',
    direccion: '',
    especialidadDeComida: '',
    cupoMaximo: 1,
  });
  protected readonly registerForm = form(this.model, (path) => {
    const whenCliente = { when: () => !this.isRestaurante() };
    const whenRestaurante = { when: () => this.isRestaurante() };
    required(path.nombre, { ...whenCliente, message: 'El nombre es obligatorio.' });
    required(path.apellido, { ...whenCliente, message: 'El apellido es obligatorio.' });
    required(path.email, { message: 'El email es obligatorio.' });
    email(path.email, { message: 'Ingresá un email válido.' });
    required(path.password, { message: 'La contraseña es obligatoria.' });
    minLength(path.password, 6, {
      message: 'La contraseña debe tener entre 6 y 30 caracteres.',
    });
    maxLength(path.password, 30, {
      message: 'La contraseña debe tener entre 6 y 30 caracteres.',
    });
    required(path.telefono, { message: 'El teléfono es obligatorio.' });
    required(path.nombreRestaurante, {
      ...whenRestaurante,
      message: 'El nombre del restaurante es obligatorio.',
    });
    required(path.direccion, { ...whenRestaurante, message: 'La dirección es obligatoria.' });
    required(path.especialidadDeComida, {
      ...whenRestaurante,
      message: 'Elegí una especialidad.',
    });
    min(path.cupoMaximo, 1, { message: 'La capacidad debe ser al menos 1.' });
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.errorMessage.set(null);
    this.intentoEnviar.set(true);
    if (this.isRestaurante() && errorDeFotosRegistro(this.fotos())) {
      return;
    }
    await submit(this.registerForm, async () => {
      try {
        await firstValueFrom(this.register());
        if (this.isRestaurante()) {
          this.pendingApproval.set(true);
        } else {
          await this.router.navigateByUrl(this.portal().loginPath);
        }
      } catch (error) {
        this.errorMessage.set(toMessage(error));
      }
      return undefined;
    });
  }

  private register(): Observable<unknown> {
    const value = this.model();
    if (this.isRestaurante() && value.especialidadDeComida !== '') {
      return this.auth.registerRestaurante(
        {
        email: value.email,
        password: value.password,
        telefono: value.telefono,
        nombreRestaurante: value.nombreRestaurante,
        direccion: value.direccion,
        especialidadDeComida: value.especialidadDeComida,
        cupoMaximo: value.cupoMaximo,
        },
        { fotos: this.fotos(), portada: this.portada() },
      );
    }
    return this.auth.registerCliente({
      nombre: value.nombre,
      apellido: value.apellido,
      email: value.email,
      password: value.password,
      telefono: value.telefono,
    });
  }
}

function toMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Conflict) {
    return 'Ya existe una cuenta con este email.';
  }
  if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.BadRequest) {
    return backendMessage(error) ?? 'Algunos datos no son válidos. Revisá el formulario.';
  }
  if (isConnectionError(error)) {
    return CONNECTION_ERROR_MESSAGE;
  }
  return 'Algo salió mal. Intentá de nuevo.';
}
