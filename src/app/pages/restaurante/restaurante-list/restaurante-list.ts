import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { nombreEspecialidad } from '../../../models/restaurante';
import { RestaurantService } from '../../../services/restaurant-service';

@Component({
  selector: 'app-restaurante-list',
  imports: [RouterLink],
  styleUrl: './restaurante-list.css',
  templateUrl: './restaurante-list.html',
})
export class RestauranteList {
  private readonly restaurantService = inject(RestaurantService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restaurantes = this.restaurantService.restaurantes;
  readonly cargando = this.restaurantService.cargando;
  readonly error = this.restaurantService.error;

  constructor() {
    this.cargar();
  }

  recargar(): void {
    this.cargar();
  }

  especialidad(valor: string): string {
    return nombreEspecialidad(valor);
  }

  private cargar(): void {
    this.restaurantService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
