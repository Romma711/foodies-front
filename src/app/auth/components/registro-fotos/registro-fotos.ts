import { Component, computed, DestroyRef, inject, input, model } from '@angular/core';
import {
  ACCEPT_IMAGEN,
  errorDeFotosRegistro,
  MAX_FOTOS,
  MIN_FOTOS,
} from '../../../core/catalog/fotos';

/** Elección de las fotos del registro: entre 3 y 5, y cuál de ellas es la portada. */
@Component({
  selector: 'app-registro-fotos',
  templateUrl: './registro-fotos.html',
})
export class RegistroFotos {
  readonly fotos = model<File[]>([]);
  /** Índice en `fotos` de la portada. */
  readonly portada = model(0);
  /** Se muestran los errores recién después del primer intento de enviar. */
  readonly mostrarErrores = input(false);

  protected readonly accept = ACCEPT_IMAGEN;
  protected readonly minFotos = MIN_FOTOS;
  protected readonly maxFotos = MAX_FOTOS;
  protected readonly error = computed(() => errorDeFotosRegistro(this.fotos()));
  protected readonly completas = computed(() => this.fotos().length >= MAX_FOTOS);

  private readonly previews = new Map<File, string>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.previews.forEach((url) => URL.revokeObjectURL(url)));
  }

  protected preview(archivo: File): string | null {
    // jsdom (tests) no implementa createObjectURL.
    if (typeof URL.createObjectURL !== 'function') {
      return null;
    }
    let url = this.previews.get(archivo);
    if (!url) {
      url = URL.createObjectURL(archivo);
      this.previews.set(archivo, url);
    }
    return url;
  }

  protected agregar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevas = [...(input.files ?? [])];
    input.value = '';
    this.fotos.update((actuales) => [...actuales, ...nuevas].slice(0, MAX_FOTOS));
  }

  /** La portada sigue siendo la misma foto; si se quita la portada, pasa a serlo la primera. */
  protected quitar(indice: number): void {
    this.fotos.update((actuales) => actuales.filter((_, i) => i !== indice));
    this.portada.update((actual) => {
      if (indice === actual) {
        return 0;
      }
      return indice < actual ? actual - 1 : actual;
    });
  }
}
