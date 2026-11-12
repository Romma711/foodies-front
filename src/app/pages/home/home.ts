import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ESPECIALIDADES } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { ESPECIALIDAD_LABELS } from '../../core/catalog/especialidades';
import { RestauranteService } from '../restaurante/services/restaurante.service';

/** Cuántos restaurantes se destacan en el home; el resto está en `/restaurantes`. */
const DESTACADOS = 3;

@Component({
  imports: [RouterLink],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly restauranteService = inject(RestauranteService);

  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  /** Each chip opens the catalog already filtered by its specialty. */
  protected readonly especialidades = ESPECIALIDADES.map((valor) => ({
    valor,
    etiqueta: ESPECIALIDAD_LABELS[valor],
  }));
  protected readonly esCliente = computed(() => this.auth.isAuthenticated('CLIENTE'));

  protected readonly cargando = this.restauranteService.loading;
  protected readonly destacados = computed(() =>
    this.restauranteService.restaurantes().slice(0, DESTACADOS),
  );

  protected readonly pasos = [
    {
      titulo: 'Elegí el lugar',
      texto: 'Recorré los restaurantes por especialidad, mirá sus fotos y su carta.',
    },
    {
      titulo: 'Reservá tu mesa',
      texto: 'Elegí día, horario y cantidad de personas en un par de clics.',
    },
    {
      titulo: 'Contá cómo te fue',
      texto: 'Dejá tu reseña y ayudá a otros a encontrar su próxima mesa.',
    },
  ];

  constructor() {
    // Los destacados son un extra: si falla la carga, el home se muestra igual sin esa sección.
    this.restauranteService
      .listar()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({ error: () => undefined });
  }

  protected inicial(nombre: string): string {
    return nombre.trim().charAt(0).toUpperCase() || 'F';
  }
}
