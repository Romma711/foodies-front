import {
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { enfocarTrasRender, PRIMER_CAMPO } from '../../../shared/a11y/enfocar';
import {
  form,
  FormField,
  max,
  maxLength,
  min,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ResenaDetailDTO, ResenaListDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';
import { StarRating } from '../star-rating/star-rating';
import { TClavePipe, TPipe } from '@core/i18n/t.pipe';
import { clave } from '@core/i18n/traducir';

interface ResenaFormModel {
  calificacion: number;
  comentario: string;
}

@Component({
  selector: 'app-resena-form',
  imports: [TClavePipe, TPipe, FormField, StarRating],
  templateUrl: './resena-form.html',
})
export class ResenaForm {
  private readonly resenaService = inject(ResenaService);

  constructor() {
    // The form replaces the button that opened it, so focus moves to its first field.
    enfocarTrasRender(inject(ElementRef), PRIMER_CAMPO, inject(Injector));
  }

  readonly restauranteId = input.required<number>();
  readonly nombreRestaurante = input('');
  /** When set, the form edits this review instead of creating a new one. */
  readonly resena = input<ResenaListDTO | null>(null);

  readonly creada = output<ResenaDetailDTO>();
  readonly actualizada = output<ResenaDetailDTO>();
  readonly cancelada = output<void>();

  protected readonly saving = this.resenaService.saving;
  protected readonly error = this.resenaService.mutationError;

  protected readonly maxComentario = 255;

  protected readonly esEdicion = computed(() => this.resena() !== null);

  protected readonly modelo = linkedSignal<ResenaFormModel>(() => ({
    calificacion: this.resena()?.calificacion ?? 0,
    comentario: this.resena()?.comentario ?? '',
  }));

  protected readonly formulario = form(this.modelo, (path) => {
    min(path.calificacion, 1, { message: clave('resena.validacion.minimo') });
    max(path.calificacion, 5, { message: clave('resena.validacion.maximo') });
    required(path.comentario, { message: clave('resena.validacion.comentario') });
    minLength(path.comentario, 10, { message: clave('resena.validacion.minLargo') });
    maxLength(path.comentario, 255, { message: clave('resena.validacion.maxLargo') });
  });

  protected readonly restantes = computed(() =>
    Math.max(0, this.maxComentario - (this.modelo().comentario?.length ?? 0)),
  );

  protected setCalificacion(valor: number): void {
    this.modelo.update((modelo) => ({ ...modelo, calificacion: valor }));
    this.formulario.calificacion().markAsTouched();
  }

  async enviar(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.formulario, async () => {
      const comentario = this.modelo().comentario.trim();
      const calificacion = this.modelo().calificacion;
      const existente = this.resena();
      try {
        if (existente) {
          const actualizada = await firstValueFrom(
            this.resenaService.actualizar(existente.id, { comentario, calificacion }),
          );
          this.actualizada.emit(actualizada);
        } else {
          const creada = await firstValueFrom(
            this.resenaService.crear({
              comentario,
              calificacion,
              restaurantId: this.restauranteId(),
            }),
          );
          this.creada.emit(creada);
        }
      } catch {
        // El error queda expuesto por `mutationError`.
      }
      return undefined;
    });
  }

  protected cancelar(): void {
    this.cancelada.emit();
  }
}
