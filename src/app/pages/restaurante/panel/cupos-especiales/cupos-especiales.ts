import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { formatearDia, panelErrorMessage, parseLocalDate, toIsoDate } from '../panel-errors';
import { CupoEspecial, MAX_MOTIVO_CUPO } from '../panel.models';
import { RestaurantePanelService } from '../restaurante-panel.service';

interface CupoEspecialModel {
  fecha: string;
  cupo: number;
  motivo: string;
}

/** Días puntuales en los que el restaurante recibe menos personas que su capacidad normal. */
@Component({
  imports: [ConfirmDialog, FormField],
  selector: 'app-cupos-especiales',
  styleUrl: './cupos-especiales.css',
  templateUrl: './cupos-especiales.html',
})
export class CuposEspeciales implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly hoy = toIsoDate(new Date());

  protected readonly maxMotivo = MAX_MOTIVO_CUPO;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly cupoMaximo = signal(0);
  protected readonly cupos = signal<CupoEspecial[]>([]);
  /** Fecha del cupo que se está quitando, para deshabilitar solo su botón. */
  protected readonly quitando = signal<string | null>(null);

  private readonly model = signal<CupoEspecialModel>({ fecha: '', cupo: 0, motivo: '' });
  protected readonly cupoForm = form(this.model, (path) => {
    required(path.fecha, { message: 'Elegí un día.' });
    validate(path.fecha, ({ value }) =>
      value() && value() < this.hoy
        ? { kind: 'fechaPasada', message: 'Elegí un día de hoy en adelante.' }
        : null,
    );
    validate(path.cupo, ({ value }) => {
      const cupo = value();
      return cupo === null || cupo === undefined || cupo < 0 || cupo > this.cupoMaximo()
        ? { kind: 'rango', message: `El cupo debe estar entre 0 y ${this.cupoMaximo()}.` }
        : null;
    });
    maxLength(path.motivo, MAX_MOTIVO_CUPO, {
      message: `El motivo puede tener hasta ${MAX_MOTIVO_CUPO} caracteres.`,
    });
  });

  protected readonly formatearFecha = (fecha: string) => formatearDia(parseLocalDate(fecha));

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const { restaurante, cupos } = await firstValueFrom(
        forkJoin({
          restaurante: this.panel.getMiRestaurante(),
          cupos: this.panel.getCuposEspeciales(),
        }),
      );
      this.cupoMaximo.set(restaurante.cupoMaximo);
      this.cupos.set(cupos);
      this.model.update((model) => ({ ...model, cupo: restaurante.cupoMaximo }));
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'No pudimos cargar la capacidad especial.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);
    this.status.set(null);
    await submit(this.cupoForm, async () => {
      const { fecha, cupo, motivo } = this.model();
      try {
        const guardado = await firstValueFrom(
          this.panel.guardarCupoEspecial(fecha, { cupo, motivo: motivo.trim() || null }),
        );
        this.cupos.update((cupos) =>
          [...cupos.filter((c) => c.fecha !== guardado.fecha), guardado].sort((a, b) =>
            a.fecha.localeCompare(b.fecha),
          ),
        );
        this.status.set('Capacidad especial guardada.');
      } catch (error) {
        this.error.set(
          mensajeDeNegocio(error) ??
            panelErrorMessage(error, 'No pudimos guardar la capacidad especial. Intentá de nuevo.'),
        );
      }
      return undefined;
    });
  }

  protected async quitar(cupo: CupoEspecial): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const confirmado = await this.confirm().open({
      heading: '¿Quitar la capacidad especial?',
      message: `${this.formatearFecha(cupo.fecha)} vuelve a tu capacidad normal de ${this.cupoMaximo()} personas.`,
      confirmLabel: 'Quitar',
    });
    if (!confirmado) {
      return;
    }
    this.quitando.set(cupo.fecha);
    try {
      await firstValueFrom(this.panel.eliminarCupoEspecial(cupo.fecha));
      this.cupos.update((cupos) => cupos.filter((c) => c.fecha !== cupo.fecha));
      this.status.set('Capacidad especial quitada.');
    } catch (error) {
      this.error.set(
        panelErrorMessage(error, 'No pudimos quitar la capacidad especial. Intentá de nuevo.'),
      );
    } finally {
      this.quitando.set(null);
    }
  }
}

/** Los 400 de esta sección traen un mensaje pensado para el encargado (por ejemplo, cuántas personas ya reservaron). */
function mensajeDeNegocio(error: unknown): string | null {
  if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.BadRequest) {
    const mensaje = (error.error as { mensaje?: unknown } | null)?.mensaje;
    return typeof mensaje === 'string' && mensaje.trim() ? mensaje : null;
  }
  return null;
}
