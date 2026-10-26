import { Component, computed, input } from '@angular/core';
import { ResenaListDTO } from '../../models';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-resena-card',
  imports: [StarRating],
  template: `
    <article
      class="flex h-full flex-col rounded-2xl border border-line/60 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <header class="flex items-start gap-3">
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

      <blockquote class="mt-4 flex-1">
        <p
          class="whitespace-pre-line break-words text-[0.95rem] leading-7 text-ink-700"
          data-testid="comentario"
        >{{ resena().comentario }}</p>
      </blockquote>
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
