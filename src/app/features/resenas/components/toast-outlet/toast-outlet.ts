import { Component, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  imports: [NgTemplateOutlet],
  template: `
    <div
      class="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      <!-- Live regions stay mounted so screen readers pick up every toast that lands in them. -->
      <div class="flex w-full flex-col gap-2 sm:w-96" role="status" aria-live="polite">
        @for (toast of exitos(); track toast.id) {
          <ng-container
            [ngTemplateOutlet]="item"
            [ngTemplateOutletContext]="{ $implicit: toast }"
          />
        }
      </div>
      <div class="flex w-full flex-col gap-2 sm:w-96" role="alert" aria-live="assertive">
        @for (toast of errores(); track toast.id) {
          <ng-container
            [ngTemplateOutlet]="item"
            [ngTemplateOutletContext]="{ $implicit: toast }"
          />
        }
      </div>
    </div>

    <ng-template #item let-toast>
      <div
        class="pointer-events-auto flex items-start gap-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-line/70"
        data-testid="toast"
      >
        @if (toast.tipo === 'exito') {
          <span
            class="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700"
            aria-hidden="true"
          >
            <svg
              class="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m5 12 5 5 9-10" />
            </svg>
          </span>
        } @else {
          <span
            class="grid size-6 shrink-0 place-items-center rounded-full bg-red-50 text-red-700"
            aria-hidden="true"
          >
            <svg
              class="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            >
              <path d="M12 7v6M12 17h.01" />
            </svg>
          </span>
        }
        <p class="flex-1 pt-0.5 text-sm font-medium leading-5 text-ink-900">{{ toast.mensaje }}</p>
        <button
          type="button"
          class="-m-1 rounded-full p-1 text-ink-500 transition hover:bg-cream-100 hover:text-ink-900"
          aria-label="Cerrar notificación"
          (click)="cerrar(toast.id)"
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </ng-template>
  `,
})
export class ToastOutlet {
  private readonly toastService = inject(ToastService);

  protected readonly exitos = computed(() =>
    this.toastService.toasts().filter((toast) => toast.tipo === 'exito'),
  );
  protected readonly errores = computed(() =>
    this.toastService.toasts().filter((toast) => toast.tipo === 'error'),
  );

  protected cerrar(id: number): void {
    this.toastService.cerrar(id);
  }
}
