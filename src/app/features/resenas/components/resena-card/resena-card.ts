import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
            <app-star-rating [value]="resena().calificacion" size="sm" [mostrarValor]="true" />
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
        @if (eliminable() && !confirmando()) {
          <button
            #botonEliminar
            type="button"
            class="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition hover:bg-red-50 hover:text-red-700"
            aria-label="Eliminar reseña"
            (click)="pedirConfirmacion()"
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
              <path
                d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
              />
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

      @if (confirmando()) {
        <div
          class="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4"
          role="group"
          aria-label="Confirmar eliminación"
        >
          <p class="text-sm font-semibold text-ink-900">¿Eliminar esta reseña?</p>
          <div class="flex gap-2">
            <button
              #botonCancelar
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-cream-100 disabled:opacity-60"
              [disabled]="eliminando()"
              (click)="cancelarEliminacion()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-progress disabled:opacity-60"
              [disabled]="eliminando()"
              (click)="eliminar.emit()"
            >
              {{ eliminando() ? 'Eliminando…' : 'Eliminar' }}
            </button>
          </div>
        </div>
      }
    </article>
  `,
})
export class ResenaCard {
  readonly resena = input.required<ResenaListDTO>();
  readonly editable = input(false);
  readonly eliminable = input(false);
  readonly eliminando = input(false);

  readonly editar = output<void>();
  /** Emitted only after the user confirms the deletion inside the card. */
  readonly eliminar = output<void>();

  protected readonly confirmando = signal(false);

  private readonly injector = inject(Injector);
  private readonly botonEliminar = viewChild<ElementRef<HTMLButtonElement>>('botonEliminar');
  private readonly botonCancelar = viewChild<ElementRef<HTMLButtonElement>>('botonCancelar');

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

  protected pedirConfirmacion(): void {
    this.confirmando.set(true);
    afterNextRender(() => this.botonCancelar()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected cancelarEliminacion(): void {
    this.confirmando.set(false);
    afterNextRender(() => this.botonEliminar()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  private hash(value: string): number {
    return Array.from(value).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 7);
  }
}
