import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Clave } from '@core/i18n/traducir';
import { ESPECIALIDADES } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { ESPECIALIDAD_LABELS } from '../../../restaurantes/models/especialidades';
import { RestauranteService } from '../../../restaurantes/services/restaurante.service';
import { TPipe } from '@core/i18n/t.pipe';

/** Cuántos restaurantes se destacan en el home; el resto está en `/restaurantes`. */
const DESTACADOS = 3;

@Component({
  imports: [TPipe, RouterLink],
  selector: 'app-home',
  templateUrl: './home.html',
})
export class Home {
  private readonly auth = inject(AuthService);
  private readonly restauranteService = inject(RestauranteService);
  private readonly router = inject(Router);

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

  protected readonly pasos: readonly { titulo: Clave; texto: Clave }[] = [
    {
      titulo: 'home.paso1.titulo',
      texto: 'home.paso1.texto',
    },
    {
      titulo: 'home.paso2.titulo',
      texto: 'home.paso2.texto',
    },
    {
      titulo: 'home.paso3.titulo',
      texto: 'home.paso3.texto',
    },
  ];

  constructor() {
    // Los destacados son un extra: si falla la carga, el home se muestra igual sin esa sección.
    this.restauranteService
      .listar()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({ error: () => undefined });
  }

  /** Opens the catalog already filtered by name; an empty search shows every restaurant. */
  protected buscar(event: Event, texto: string): void {
    event.preventDefault();
    const q = texto.trim();
    void this.router.navigate(['/restaurantes'], { queryParams: q ? { q } : {} });
  }

  protected inicial(nombre: string): string {
    return nombre.trim().charAt(0).toUpperCase() || 'F';
  }
}
