import { HttpEventType } from '@angular/common/http';
import { Component, computed, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { panelErrorMessage } from '../panel-errors';
import { Carta as CartaModel, MAX_CARTA_BYTES } from '../panel.models';
import { RestaurantePanelService } from '../restaurante-panel.service';

/** Menu URLs come from our backend: local storage (`/api/files/…`) or the R2 public domain. */
const PREVIEWABLE_URL = /^(\/api\/files\/|https:\/\/)/;

@Component({
  imports: [ConfirmDialog, DatePipe],
  selector: 'app-carta',
  styleUrl: './carta.css',
  templateUrl: './carta.html',
})
export class CartaPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly confirm = viewChild.required(ConfirmDialog);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly carta = signal<CartaModel | null>(null);
  /** Upload percentage while uploading, null otherwise. */
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
      this.loadError.set(panelErrorMessage(error, 'Could not load your menu.'));
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
        heading: 'Replace your menu?',
        message: `"${file.name}" will replace the current menu for your customers.`,
        confirmLabel: 'Replace menu',
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
          this.status.set('Menu uploaded. Customers can see it now.');
        }
      },
      error: (error: unknown) => {
        this.error.set(
          panelErrorMessage(error, 'The file could not be uploaded. Make sure it is a valid PDF.'),
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
      heading: 'Delete your menu?',
      message: 'Customers will not see a menu until you upload a new one.',
      confirmLabel: 'Delete menu',
      tone: 'danger',
    });
    if (!confirmed) {
      return;
    }
    this.busy.set(true);
    try {
      await firstValueFrom(this.panel.eliminarCarta());
      this.carta.set(null);
      this.status.set('Menu deleted.');
    } catch (error) {
      this.error.set(panelErrorMessage(error, 'Could not delete the menu. Please try again.'));
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
    return 'Choose a PDF file.';
  }
  if (file.size > MAX_CARTA_BYTES) {
    return 'The file is larger than 10 MB.';
  }
  return null;
}
