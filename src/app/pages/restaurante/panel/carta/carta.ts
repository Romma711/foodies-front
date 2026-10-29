import { HttpEventType } from '@angular/common/http';
import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { formatearFechaHora, panelErrorMessage } from '../panel-errors';
import { Carta as CartaModel, MAX_CARTA_BYTES } from '../panel.models';
import { RestaurantePanelService } from '../restaurante-panel.service';

/** Las URLs de la carta vienen del backend: almacenamiento local (`/api/files/…`) o el dominio público de R2. */
const PREVIEWABLE_URL = /^(\/api\/files\/|https:\/\/)/;

@Component({
  imports: [ConfirmDialog],
  selector: 'app-carta',
  styleUrl: './carta.css',
  templateUrl: './carta.html',
})
export class CartaPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly confirm = viewChild.required(ConfirmDialog);

  protected readonly formatearFechaHora = formatearFechaHora;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly carta = signal<CartaModel | null>(null);
  /** Porcentaje de subida mientras se sube el archivo; null en otro caso. */
  protected readonly progress = signal<number | null>(null);
  protected readonly busy = signal(false);
  protected readonly dragActive = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);

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
      this.loadError.set(panelErrorMessage(error, 'No pudimos cargar tu carta.'));
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
        heading: '¿Reemplazar tu carta?',
        message: `"${file.name}" va a reemplazar la carta que ven tus clientes.`,
        confirmLabel: 'Reemplazar carta',
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
          this.status.set('Carta subida. Tus clientes ya la pueden ver.');
        }
      },
      error: (error: unknown) => {
        this.error.set(
          panelErrorMessage(error, 'No pudimos subir el archivo. Revisá que sea un PDF válido.'),
        );
        this.finishUpload();
      },
      complete: () => this.finishUpload(),
    });
  }

  protected async remove(): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const confirmed = await this.confirm().open({
      heading: '¿Eliminar tu carta?',
      message: 'Tus clientes no van a ver ninguna carta hasta que subas una nueva.',
      confirmLabel: 'Eliminar carta',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(this.panel.eliminarCarta());
      this.carta.set(null);
      this.status.set('Carta eliminada.');
    } catch (error) {
      this.error.set(panelErrorMessage(error, 'No pudimos eliminar la carta. Intentá de nuevo.'));
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

function validate(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return 'Elegí un archivo PDF.';
  }
  if (file.size > MAX_CARTA_BYTES) {
    return 'El archivo pesa más de 10 MB.';
  }
  return null;
}
