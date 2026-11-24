import { HttpEventType } from '@angular/common/http';
import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { formatearFechaHora, panelErrorMessage } from '../../utils/panel-errors';
import { Mensaje } from '@core/i18n/traducir';
import { Carta as CartaModel, MAX_CARTA_BYTES } from '../../models/panel.models';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import { TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';

/** Las URLs de la carta vienen del backend: almacenamiento local (`/api/files/…`) o el dominio público de R2. */
const PREVIEWABLE_URL = /^(\/api\/files\/|https:\/\/)/;

@Component({
  imports: [TPipe, ConfirmDialog],
  selector: 'app-carta',
  styleUrl: './carta.css',
  templateUrl: './carta.html',
})
export class CartaPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly i18n = inject(I18n);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly confirm = viewChild.required(ConfirmDialog);

  protected formatearFechaHora(valor: string): string {
    return formatearFechaHora(valor, this.i18n.locale());
  }
  protected readonly loading = signal(true);
  protected readonly loadError = signal<Mensaje | null>(null);
  protected readonly carta = signal<CartaModel | null>(null);
  /** Porcentaje de subida mientras se sube el archivo; null en otro caso. */
  protected readonly progress = signal<number | null>(null);
  protected readonly busy = signal(false);
  protected readonly dragActive = signal(false);
  protected readonly error = signal<Mensaje | null>(null);
  protected readonly status = signal<Mensaje | null>(null);

  protected readonly previewUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.carta()?.url;
    return url && PREVIEWABLE_URL.test(url)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url)
      : null;
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const resto = await firstValueFrom(this.panel.getMiRestaurante());
      this.carta.set(resto.carta);
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'panel.carta.error.cargar'));
    } finally {
      this.loading.set(false);
    }
  }

  protected chooseFile(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      void this.upload(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void this.upload(file);
    }
  }

  protected async upload(file: File): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const invalid = validate(file);
    if (invalid) {
      this.error.set(invalid);
      return;
    }
    if (
      this.carta() &&
      !(await this.confirm().open({
        heading: this.i18n.t('panel.carta.reemplazarTitulo'),
        message: this.i18n.t('panel.carta.reemplazarTexto', { nombre: file.name }),
        confirmLabel: this.i18n.t('panel.carta.reemplazarBoton'),
      }))
    ) {
      return;
    }

    this.busy.set(true);
    this.progress.set(0);
    this.panel.subirCarta(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.carta.set(event.body);
          this.status.set({ clave: 'panel.carta.subida' });
        }
      },
      error: (error: unknown) => {
        this.error.set(panelErrorMessage(error, 'panel.carta.error.subir'));
        this.finishUpload();
      },
      complete: () => this.finishUpload(),
    });
  }

  protected async remove(): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const confirmed = await this.confirm().open({
      heading: this.i18n.t('panel.carta.eliminarTitulo'),
      message: this.i18n.t('panel.carta.eliminarTexto'),
      confirmLabel: this.i18n.t('panel.carta.eliminarBoton'),
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(this.panel.eliminarCarta());
      this.carta.set(null);
      this.status.set({ clave: 'panel.carta.eliminada' });
    } catch (error) {
      this.error.set(panelErrorMessage(error, 'panel.carta.error.eliminar'));
    } finally {
      this.busy.set(false);
    }
  }

  protected formatSize(bytes: number | null): string {
    if (bytes === null) {
      return '';
    }
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private finishUpload(): void {
    this.busy.set(false);
    this.progress.set(null);
  }
}

function validate(file: File): Mensaje | null {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return { clave: 'panel.carta.error.noPdf' };
  }
  if (file.size > MAX_CARTA_BYTES) {
    return { clave: 'panel.error.archivoGrande' };
  }
  return null;
}
