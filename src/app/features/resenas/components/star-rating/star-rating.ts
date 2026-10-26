import { Component, computed, input, output, signal } from '@angular/core';

let nextStarRatingId = 0;

@Component({
  selector: 'app-star-rating',
  template: `
    @if (interactive()) {
      <div
        class="inline-flex items-center gap-0.5"
        role="radiogroup"
        [attr.aria-label]="label() || null"
        [attr.aria-describedby]="describedBy() || null"
        [attr.aria-invalid]="invalid() || null"
        (mouseleave)="hover.set(0)"
      >
        @for (star of starIndexes(); track star) {
          <label
            class="cursor-pointer rounded-lg p-0.5 transition hover:scale-105"
            (mouseenter)="hover.set(star)"
          >
            <input
              class="peer sr-only"
              type="radio"
              [name]="groupName"
              [value]="star"
              [checked]="value() === star"
              [attr.aria-label]="star + ' de ' + max() + ' estrellas'"
              [attr.aria-invalid]="invalid() || null"
              [attr.aria-describedby]="describedBy() || null"
              (change)="seleccionar(star)"
            />
            <svg
              class="rounded-lg transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white"
              [style.width.px]="pixelSize()"
              [style.height.px]="pixelSize()"
              [class.text-star]="displayValue() >= star"
              [class.text-cream-200]="displayValue() < star"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M10 1.8l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.4l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.8z"
              />
            </svg>
          </label>
        }
      </div>
    } @else {
      <span class="inline-flex items-center gap-0.5" role="img" [attr.aria-label]="ariaLabel()">
        @for (star of stars(); track $index) {
          <span
            class="relative inline-block shrink-0"
            [style.width.px]="pixelSize()"
            [style.height.px]="pixelSize()"
            data-testid="star"
          >
            <svg
              class="absolute inset-0 h-full w-full text-cream-200"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M10 1.8l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.4l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.8z"
              />
            </svg>
            <span class="absolute inset-y-0 left-0 overflow-hidden" [style.width.%]="star">
              <svg
                class="h-full text-star"
                [style.width.px]="pixelSize()"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M10 1.8l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.4l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.8z"
                />
              </svg>
            </span>
          </span>
        }
      </span>
    }
  `,
})
export class StarRating {
  readonly value = input.required<number>();
  readonly max = input(5);
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('sm');
  readonly interactive = input(false);
  readonly label = input('');
  readonly describedBy = input('');
  readonly invalid = input(false);

  readonly valueChange = output<number>();

  protected readonly hover = signal(0);
  protected readonly groupName = `star-rating-${nextStarRatingId++}`;

  readonly starIndexes = computed(() =>
    Array.from({ length: this.max() }, (_, index) => index + 1),
  );

  protected readonly displayValue = computed(() => this.hover() || this.value());

  readonly stars = computed(() => {
    const value = Math.max(0, Math.min(this.value(), this.max()));
    return Array.from({ length: this.max() }, (_, index) =>
      Math.round(Math.max(0, Math.min(1, value - index)) * 100),
    );
  });

  readonly ariaLabel = computed(() => {
    const value = this.value();
    return value > 0
      ? `Calificación: ${value.toFixed(1)} de ${this.max()} estrellas`
      : 'Sin calificación';
  });

  readonly pixelSize = computed(() => ({ sm: 16, md: 20, lg: 28, xl: 36 })[this.size()]);

  protected seleccionar(valor: number): void {
    this.hover.set(0);
    this.valueChange.emit(valor);
  }
}
