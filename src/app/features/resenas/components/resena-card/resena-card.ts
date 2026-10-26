import { Component, computed, input, output } from '@angular/core';
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
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-bold text-ink-900" data-testid="nombre">
            {{ nombre() }}
          </p>
          <div class="mt-1">
            <app-star-rating [value]="resena().calificacion" size="sm" />
          </div>
        </div>
        @if (editable()) {
          <button
            type="button"
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition hover:bg-cream-100 hover:text-ink-900"
            aria-label="Editar tu reseña"
            (click)="editar.emit()"
          >
            <svg
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
            </svg>
          </button>
        }
      </header>

      <blockquote class="mt-4 flex-1">
        <p
          class="whitespace-pre-line break-words text-[0.95rem] leading-7 text-ink-700"
          data-testid="comentario"
        >
          {{ resena().comentario }}
        </p>
      </blockquote>
    </article>
  `,
})
export class ResenaCard {
  readonly resena = input.required<ResenaListDTO>();
  readonly editable = input(false);

  readonly editar = output<void>();

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
