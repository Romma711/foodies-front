import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import {
  ACCEPT_IMAGEN,
  errorDeImagen,
  Foto,
  MAX_FOTOS,
  MIN_FOTOS,
} from '../../../restaurantes/utils/fotos';
import { mensajeDeNegocio, panelErrorMessage } from '../../utils/panel-errors';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import { I18n } from '@core/i18n/i18n.service';
import { Mensaje } from '@core/i18n/traducir';
import { TPipe } from '@core/i18n/t.pipe';

/** Foto a reemplazar con el archivo que se elija; null para subir una nueva. */
type Destino = Foto | null;

/** Fotos del restaurante: la portada es la miniatura del catálogo; las demás, la galería del detalle. */
@Component({
  imports: [TPipe, ConfirmDialog],
  selector: 'app-fotos-panel',
  styleUrl: './fotos.css',
  templateUrl: './fotos.html',
})
export class FotosPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly i18n = inject(I18n);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly confirm = viewChild.required(ConfirmDialog);
  private destino: Destino = null;

  protected readonly accept = ACCEPT_IMAGEN;
  protected readonly minFotos = MIN_FOTOS;
  protected readonly maxFotos = MAX_FOTOS;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<Mensaje | null>(null);
  protected readonly error = signal<Mensaje | null>(null);
  protected readonly status = signal<Mensaje | null>(null);
  protected readonly busy = signal(false);
  protected readonly fotos = signal<Foto[]>([]);

  protected readonly completas = computed(() => this.fotos().length >= MIN_FOTOS);
  protected readonly puedeAgregar = computed(() => this.fotos().length < MAX_FOTOS);
  protected readonly puedeBorrar = computed(() => this.fotos().length > MIN_FOTOS);

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.fotos.set(await firstValueFrom(this.panel.getFotos()));
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'panel.fotos.error.cargar'));
    } finally {
      this.loading.set(false);
    }
  }

  protected subir(): void {
    this.elegirArchivo(null);
  }

  protected reemplazar(foto: Foto): void {
    this.elegirArchivo(foto);
  }

  protected async onFileChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    const destino = this.destino;
    this.destino = null;
    if (!archivo) {
      return;
    }
    this.error.set(null);
    this.status.set(null);
    const invalida = errorDeImagen(archivo);
    if (invalida) {
      this.error.set(invalida);
      return;
    }

    this.busy.set(true);
    try {
      if (destino === null) {
        const nueva = await firstValueFrom(this.panel.subirFoto(archivo));
        this.fotos.update((fotos) => [...fotos, nueva]);
        this.status.set({ clave: 'panel.fotos.subida' });
      } else {
        const nueva = await firstValueFrom(this.panel.reemplazarFoto(destino.id, archivo));
        this.fotos.update((fotos) => fotos.map((f) => (f.id === nueva.id ? nueva : f)));
        this.status.set({ clave: 'panel.fotos.reemplazada' });
      }
    } catch (error) {
      this.error.set(
        mensajeDeNegocio(error) ?? panelErrorMessage(error, 'panel.fotos.error.subir'),
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async usarComoPortada(foto: Foto): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    this.busy.set(true);
    try {
      this.fotos.set(await firstValueFrom(this.panel.elegirPortada(foto.id)));
      this.status.set({ clave: 'panel.fotos.portadaActualizada' });
    } catch (error) {
      this.error.set(
        mensajeDeNegocio(error) ?? panelErrorMessage(error, 'panel.fotos.error.portada'),
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async eliminar(foto: Foto): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const confirmado = await this.confirm().open({
      heading: this.i18n.t('panel.fotos.eliminarTitulo'),
      message: this.i18n.t('panel.fotos.eliminarTexto'),
      confirmLabel: this.i18n.t('panel.fotos.eliminarBoton'),
      tone: 'danger',
    });
    if (!confirmado) {
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(this.panel.eliminarFoto(foto.id));
      this.fotos.update((fotos) => fotos.filter((f) => f.id !== foto.id));
      this.status.set({ clave: 'panel.fotos.eliminada' });
    } catch (error) {
      this.error.set(
        mensajeDeNegocio(error) ?? panelErrorMessage(error, 'panel.fotos.error.eliminar'),
      );
    } finally {
      this.busy.set(false);
    }
  }

  private elegirArchivo(destino: Destino): void {
    this.destino = destino;
    this.fileInput().nativeElement.click();
  }
}
