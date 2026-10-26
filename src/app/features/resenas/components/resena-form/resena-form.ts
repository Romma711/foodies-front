import { Component, computed, inject, input, output, signal } from '@angular/core';
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
import { ResenaDetailDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';
import { StarRating } from '../star-rating/star-rating';

interface ResenaFormModel {
  calificacion: number;
  comentario: string;
}

@Component({
  selector: 'app-resena-form',
  imports: [FormField, StarRating],
  templateUrl: './resena-form.html',
})
export class ResenaForm {
  private readonly resenaService = inject(ResenaService);

  readonly restauranteId = input.required<number>();
  readonly nombreRestaurante = input('');

  readonly creada = output<ResenaDetailDTO>();
  readonly cancelada = output<void>();

  protected readonly saving = this.resenaService.saving;
  protected readonly error = this.resenaService.mutationError;

  protected readonly maxComentario = 255;

  protected readonly modelo = signal<ResenaFormModel>({
    calificacion: 0,
    comentario: '',
  });

  protected readonly formulario = form(this.modelo, (path) => {
    min(path.calificacion, 1, { message: 'Elegí de 1 a 5 estrellas.' });
    max(path.calificacion, 5, { message: 'La calificación máxima es 5.' });
    required(path.comentario, { message: 'Contanos tu experiencia.' });
    minLength(path.comentario, 10, { message: 'Escribí al menos 10 caracteres.' });
    maxLength(path.comentario, 255, { message: 'Máximo 255 caracteres.' });
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
      try {
        const creada = await firstValueFrom(
          this.resenaService.crear({
            comentario: this.modelo().comentario.trim(),
            calificacion: this.modelo().calificacion,
            restaurantId: this.restauranteId(),
          }),
        );
        this.creada.emit(creada);
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
