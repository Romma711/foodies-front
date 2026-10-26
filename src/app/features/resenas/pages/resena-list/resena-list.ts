import { Component, computed, input } from '@angular/core';
import { RestauranteResenas } from '../../components/restaurante-resenas/restaurante-resenas';

/** Standalone route for a restaurant's reviews; the restaurant page embeds the same block. */
@Component({
  selector: 'app-resena-list',
  imports: [RestauranteResenas],
  template: `
    <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <app-restaurante-resenas [restauranteId]="id()" />
    </main>
  `,
})
export class ResenaList {
  readonly restauranteId = input.required<string>();

  readonly id = computed(() => Number(this.restauranteId()));
}
