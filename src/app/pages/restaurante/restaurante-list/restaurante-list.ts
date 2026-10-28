import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MapaRestaurantes } from '../../../features/mapa/components/mapa-restaurantes/mapa-restaurantes';
import { ESPECIALIDAD_LABELS } from '../../../core/catalog/especialidades';
import { RestauranteService } from '../services/restaurante.service';

@Component({
  imports: [RouterLink, MapaRestaurantes],
  selector: 'app-restaurante-list',
  templateUrl: './restaurante-list.html',
})
export class RestauranteList {
  private readonly restauranteService = inject(RestauranteService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly restaurantes = this.restauranteService.restaurantes;
  protected readonly cargando = this.restauranteService.loading;
  protected readonly error = this.restauranteService.error;
  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  /** Catalog layout: cards (default) or the Mar del Plata map. */
  protected readonly vista = signal<'lista' | 'mapa'>('lista');

  constructor() {
    this.cargar();
  }

  protected inicial(nombre: string): string {
    return nombre.trim().charAt(0).toUpperCase() || 'F';
  }

  protected recargar(): void {
    this.cargar();
  }

  private cargar(): void {
    this.restauranteService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
