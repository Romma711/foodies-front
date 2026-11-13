import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Pie de la barra lateral de los dashboards: el nombre de la cuenta y, al tocarlo, un popup con
 * "Cerrar sesión". Se cierra con Escape (devolviendo el foco al nombre) o con un clic afuera.
 */
@Component({
  selector: 'app-cuenta-menu',
  styleUrl: './cuenta-menu.css',
  templateUrl: './cuenta-menu.html',
  host: {
    '(document:click)': 'cerrarSiEsAfuera($event)',
    '(document:keydown.escape)': 'cerrarConEscape()',
  },
})
export class CuentaMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly nombre = input.required<string>();
  readonly cerrarSesion = output<void>();

  private readonly cuentaBoton = viewChild.required<ElementRef<HTMLButtonElement>>('cuentaBoton');
  private readonly salirBoton = viewChild.required<ElementRef<HTMLButtonElement>>('salirBoton');

  protected readonly abierta = signal(false);
  protected readonly inicial = computed(() => this.nombre().trim().charAt(0).toUpperCase() || 'F');

  protected alternar(): void {
    this.abierta.update((abierta) => !abierta);
    if (this.abierta()) {
      afterNextRender(() => this.salirBoton().nativeElement.focus(), { injector: this.injector });
    }
  }

  protected cerrarSiEsAfuera(event: MouseEvent): void {
    if (this.abierta() && !this.host.nativeElement.contains(event.target as Node)) {
      this.abierta.set(false);
    }
  }

  protected cerrarConEscape(): void {
    if (this.abierta()) {
      this.abierta.set(false);
      this.cuentaBoton().nativeElement.focus();
    }
  }
}
