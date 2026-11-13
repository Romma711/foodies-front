import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import {
  formatearDia,
  mensajeDeNegocio,
  panelErrorMessage,
  parseLocalDate,
  toIsoDate,
} from '../../utils/panel-errors';
import { CupoEspecial, Espacio, MAX_MOTIVO_CUPO } from '../../models/panel.models';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';

interface CupoEspecialModel {
  espacioId: string;
  fecha: string;
  cupo: number;
  motivo: string;
}

const claveDe = (cupo: Pick<CupoEspecial, 'idEspacio' | 'fecha'>) => `${cupo.idEspacio}-${cupo.fecha}`;

/** Días puntuales en los que un espacio recibe menos personas que su capacidad normal. */
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
  protected readonly espacios = signal<Espacio[]>([]);
  protected readonly cupos = signal<CupoEspecial[]>([]);
  /** Clave (espacio + fecha) del cupo que se está quitando, para deshabilitar solo su botón. */
  protected readonly quitando = signal<string | null>(null);
  protected readonly clave = claveDe;

  /** Solo se cargan cupos especiales en espacios activos. */
  protected readonly espaciosActivos = computed(() => this.espacios().filter((e) => e.activo));

  private readonly model = signal<CupoEspecialModel>({ espacioId: '', fecha: '', cupo: 0, motivo: '' });

  /** Espacio elegido en el formulario. */
  protected readonly espacioElegido = computed(
    () => this.espacios().find((e) => String(e.id) === this.model().espacioId) ?? null,
  );

  protected readonly cupoForm = form(this.model, (path) => {
    required(path.espacioId, { message: 'Elegí un espacio.' });
    required(path.fecha, { message: 'Elegí un día.' });
    validate(path.fecha, ({ value }) =>
      value() && value() < this.hoy
        ? { kind: 'fechaPasada', message: 'Elegí un día de hoy en adelante.' }
        : null,
    );
    validate(path.cupo, ({ value }) => {
      const cupo = value();
      const capacidad = this.espacioElegido()?.capacidad ?? 0;
      return cupo === null || cupo === undefined || cupo < 0 || cupo > capacidad
        ? { kind: 'rango', message: `El cupo debe estar entre 0 y ${capacidad}.` }
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
      const { espacios, cupos } = await firstValueFrom(
        forkJoin({
          espacios: this.panel.getEspacios(),
          cupos: this.panel.getCuposEspeciales(),
        }),
      );
      this.espacios.set(espacios);
      this.cupos.set(cupos);
      const primero = espacios.find((e) => e.activo);
      if (primero) {
        this.model.update((model) => ({
          ...model,
          espacioId: String(primero.id),
          cupo: primero.capacidad,
        }));
      }
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
      const { espacioId, fecha, cupo, motivo } = this.model();
      try {
        const guardado = await firstValueFrom(
          this.panel.guardarCupoEspecial(Number(espacioId), fecha, {
            cupo,
            motivo: motivo.trim() || null,
          }),
        );
        this.cupos.update((cupos) =>
          [...cupos.filter((c) => claveDe(c) !== claveDe(guardado)), guardado].sort(
            (a, b) => a.fecha.localeCompare(b.fecha) || a.idEspacio - b.idEspacio,
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
    const capacidad = this.espacios().find((e) => e.id === cupo.idEspacio)?.capacidad;
    const confirmado = await this.confirm().open({
      heading: '¿Quitar la capacidad especial?',
      message:
        `${this.formatearFecha(cupo.fecha)}, ${cupo.espacioNombre} vuelve a su capacidad normal` +
        (capacidad === undefined ? '.' : ` de ${capacidad} personas.`),
      confirmLabel: 'Quitar',
    });
    if (!confirmado) {
      return;
    }
    this.quitando.set(claveDe(cupo));
    try {
      await firstValueFrom(this.panel.eliminarCupoEspecial(cupo.idEspacio, cupo.fecha));
      this.cupos.update((cupos) => cupos.filter((c) => claveDe(c) !== claveDe(cupo)));
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
