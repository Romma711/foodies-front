import { Component, computed, input } from '@angular/core';
import { ResenaListDTO } from '../../models';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-resena-card',
  imports: [StarRating],
  template: `
    <article
      class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line/60 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-6"
    >
      <svg
        class="pointer-events-none absolute -top-2 right-2 size-16 text-brand-50"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M7.17 6A5.17 5.17 0 0 0 2 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 0 1 7.17 9.5V6Zm10 0A5.17 5.17 0 0 0 12 11.17V18h6.83v-6.83H15.5a1.67 1.67 0 0 1 1.67-1.67V6Z"
        />
      </svg>

      <header class="relative flex items-start gap-3">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold text-ink-900 ring-1 ring-black/5"
          [style]="avatarStyle()"
          aria-hidden="true"
          data-testid="avatar"
        >
          {{ iniciales() }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-bold text-ink-900" data-testid="nombre">
            {{ nombre() }}
          </p>
          <div class="mt-1">
            <app-star-rating [value]="resena().calificacion" size="sm" />
          </div>
        </div>
      </header>

      <blockquote class="relative mt-4 flex-1">
        <p class="text-[0.95rem] leading-7 text-ink-700" data-testid="comentario">
          {{ resena().comentario }}
        </p>
      </blockquote>

      <footer
        class="relative mt-5 flex items-center justify-between gap-3 border-t border-line/60 pt-4"
      >
        <span class="text-xs font-medium text-ink-500">Reseña #{{ resena().id }}</span>
        <span
          class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100"
          data-testid="calificacion"
        >
          {{ resena().calificacion }}.0
        </span>
      </footer>
    </article>
  `,
})
export class ResenaCard {
  readonly resena = input.required<ResenaListDTO>();

  private readonly palette = ['#fde7dc', '#e7f0ff', '#e7f6ec', '#f3e8ff', '#fff4d6', '#ffe4e6'];

  readonly nombre = computed(() => this.resena().nombreUsuario?.trim() || 'Anónimo');

  readonly iniciales = computed(() => {
    const palabras = this.nombre().split(/\s+/).filter(Boolean);
    const iniciales = palabras
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0).toUpperCase())
      .join('');
    return iniciales || '?';
  });

  readonly avatarStyle = computed(() => ({
    backgroundColor: this.palette[this.hash(this.nombre()) % this.palette.length] ?? '#fde7dc',
  }));

  private hash(value: string): number {
    return Array.from(value).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 7);
  }
}
