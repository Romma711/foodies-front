import { Component, ElementRef, signal, viewChild } from '@angular/core';

export interface ConfirmOptions {
  heading: string;
  message: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
}

let nextId = 0;

/**
 * Native `<dialog>` confirmation: modal, traps focus and closes with Escape.
 * Usage: `if (await dialog.open({...})) { ... }`.
 */
@Component({
  imports: [],
  selector: 'app-confirm-dialog',
  styleUrl: './confirm-dialog.css',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  protected readonly ids = {
    heading: `confirm-heading-${nextId}`,
    message: `confirm-message-${nextId++}`,
  };
  protected readonly options = signal<ConfirmOptions>({
    heading: '',
    message: '',
    confirmLabel: '',
  });

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private resolve: ((confirmed: boolean) => void) | null = null;

  open(options: ConfirmOptions): Promise<boolean> {
    this.resolve?.(false);
    this.options.set(options);
    const dialog = this.dialog().nativeElement;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    return new Promise((resolve) => (this.resolve = resolve));
  }

  protected choose(confirmed: boolean): void {
    this.settle(confirmed);
    const dialog = this.dialog().nativeElement;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }

  /** Escape or any other native close counts as "no". */
  protected onClose(): void {
    this.settle(false);
  }

  private settle(confirmed: boolean): void {
    this.resolve?.(confirmed);
    this.resolve = null;
  }
}
