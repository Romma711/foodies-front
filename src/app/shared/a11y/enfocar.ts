import { afterNextRender, ElementRef, Injector } from '@angular/core';

/**
 * Focuses the first element inside `host` that matches `selector` once the next render
 * finishes. Used when a form opens or closes and the element that had focus disappears.
 */
export function enfocarTrasRender(
  host: ElementRef<HTMLElement>,
  selector: string,
  injector: Injector,
): void {
  afterNextRender(
    () => {
      host.nativeElement.querySelector<HTMLElement>(selector)?.focus();
    },
    { injector },
  );
}

/** First field of a form, skipping disabled controls. */
export const PRIMER_CAMPO =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
