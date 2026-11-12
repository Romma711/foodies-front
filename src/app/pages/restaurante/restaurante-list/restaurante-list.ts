import { Component, computed, DestroyRef, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MapaRestaurantes } from '../../../features/mapa/components/mapa-restaurantes/mapa-restaurantes';
import { ESPECIALIDADES, EspecialidadDeComida } from '../../../core/auth/auth.models';
import { ESPECIALIDAD_LABELS } from '../../../core/catalog/especialidades';
import { RestauranteService } from '../services/restaurante.service';

function esEspecialidad(value: string | null | undefined): value is EspecialidadDeComida {
  return (ESPECIALIDADES as readonly string[]).includes(value ?? '');
}

@Component({
  imports: [RouterLink, MapaRestaurantes],
  selector: 'app-restaurante-list',
  templateUrl: './restaurante-list.html',
})
export class RestauranteList {
  private readonly restauranteService = inject(RestauranteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  /** `?especialidad=PASTAS` query param (bound by the router); unknown values mean "Todas". */
  readonly especialidad = input<string | null | undefined>();

  protected readonly restaurantes = this.restauranteService.restaurantes;
  protected readonly cargando = this.restauranteService.loading;
  protected readonly error = this.restauranteService.error;
  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  protected readonly opcionesEspecialidad = ESPECIALIDADES.map((valor) => ({
    valor,
    etiqueta: ESPECIALIDAD_LABELS[valor],
  }));
  /** Catalog layout: cards (default) or the Mar del Plata map. */
  protected readonly vista = signal<'lista' | 'mapa'>('lista');

  /** Selected specialty, null for "Todas"; follows the query param and the filter buttons. */
  protected readonly filtro = linkedSignal<EspecialidadDeComida | null>(() => {
    const valor = this.especialidad();
    return esEspecialidad(valor) ? valor : null;
  });

  /** Filters the already-loaded catalog: every restaurant there carries its specialty. */
  protected readonly filtrados = computed(() => {
    const filtro = this.filtro();
    const restaurantes = this.restaurantes();
    return filtro === null
      ? restaurantes
      : restaurantes.filter((restaurante) => restaurante.especialidad === filtro);
  });

  constructor() {
    this.cargar();
  }

  protected filtrar(especialidad: EspecialidadDeComida | null): void {
    this.filtro.set(especialidad);
    // Keep the URL shareable and in sync, without piling up history entries.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { especialidad },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
