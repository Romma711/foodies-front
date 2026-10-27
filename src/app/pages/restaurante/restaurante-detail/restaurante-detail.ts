import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ReservaForm } from '../../../components/reserva-form/reserva-form';
import { nombreEspecialidad } from '../../../models/restaurante';
import { RestaurantService } from '../../../services/restaurant-service';

@Component({
  selector: 'app-restaurante-detail',
  imports: [ReservaForm, RouterLink],
  styleUrl: './restaurante-detail.css',
  templateUrl: './restaurante-detail.html',
})
export class RestauranteDetail {
  private readonly restaurantService = inject(RestaurantService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restauranteId = input.required<string>();
  readonly id = computed(() => Number(this.restauranteId()));

  readonly restaurante = this.restaurantService.detalle;
  readonly cargando = this.restaurantService.cargando;
  readonly error = this.restaurantService.error;
  readonly aviso = signal<string | null>(null);

  readonly especialidad = computed(() => {
    const valor = this.restaurante()?.especialidad;
    return valor ? nombreEspecialidad(valor) : null;
  });

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

  alCrear(): void {
    this.aviso.set('¡Reserva creada! Te esperamos en el restaurante.');
  }

  private cargar(id: number): void {
    this.restaurantService
      .obtenerPorId(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
