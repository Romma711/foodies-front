import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type ToastTipo = 'exito' | 'error';

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

const DURACION_MS: Record<ToastTipo, number> = { exito: 4000, error: 6000 };

/**
 * Short-lived feedback messages. Provided per host component (not root) so each
 * reviews block owns its queue and its timers die with it.
 */
@Injectable()
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private siguienteId = 0;

  readonly toasts = this._toasts.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje);
  }

  cerrar(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private mostrar(tipo: ToastTipo, mensaje: string): void {
    const id = this.siguienteId++;
    this._toasts.update((toasts) => [...toasts, { id, tipo, mensaje }]);
    this.timers.set(
      id,
      setTimeout(() => this.cerrar(id), DURACION_MS[tipo]),
    );
  }
}
