import { Component, DestroyRef, computed, effect, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ResenaCard } from '../../components/resena-card/resena-card';
import { StarRating } from '../../components/star-rating/star-rating';
import { ResenaService } from '../../services/resena.service';

@Component({
  selector: 'app-resena-list',
  imports: [ResenaCard, RouterLink, StarRating],
  templateUrl: './resena-list.html',
})
export class ResenaList {
  private readonly resenaService = inject(ResenaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restauranteId = input.required<string>();

  readonly id = computed(() => Number(this.restauranteId()));
  readonly resenas = this.resenaService.resenas;
  readonly cargando = this.resenaService.loading;
  readonly error = this.resenaService.error;
  readonly total = this.resenaService.totalResenas;
  readonly promedio = this.resenaService.promedioCalificacion;

  constructor() {
    effect(() => {
      const id = this.id();
      if (Number.isInteger(id) && id > 0) {
        this.cargar(id);
      }
    });
  }

  recargar(): void {
    const id = this.id();
    if (Number.isInteger(id) && id > 0) {
      this.cargar(id);
    }
  }

  private cargar(id: number): void {
    this.resenaService
      .listarPorRestaurante(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
