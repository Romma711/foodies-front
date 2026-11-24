import {
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { enfocarTrasRender } from '../../../shared/a11y/enfocar';
import { firstValueFrom } from 'rxjs';
import { I18n } from '@core/i18n/i18n.service';
import { TPipe } from '@core/i18n/t.pipe';
import { Mensaje } from '@core/i18n/traducir';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { DIA_SEMANA_LABELS, DIAS_SEMANA, DiaSemana } from '../../../restaurantes/utils/horarios';
import {
  DURACION_TURNO_MAXIMA,
  DURACION_TURNO_MINIMA,
  DURACION_TURNO_POR_DEFECTO,
  Turno,
  TurnoRequest,
} from '../../models/panel.models';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import { mensajeDeConflicto, mensajeDeNegocio, panelErrorMessage } from '../../utils/panel-errors';

/** Empty form: a 90-minute shift on Monday at 20:00. */
function turnoNuevo(): TurnoRequest {
  return { dia: 'MONDAY', inicio: '20:00', duracionMinutos: DURACION_TURNO_POR_DEFECTO };
}

/**
 * Shifts of the restaurant (RF24, rule D2): each one has the full capacity of the espacios. A shift
 * with future reservations cannot be changed or removed; the server answers 409 and its message is
 * shown as is.
 */
@Component({
  imports: [TPipe, ConfirmDialog],
  selector: 'app-turnos',
  styleUrl: './turnos.css',
  templateUrl: './turnos.html',
})
export class TurnosPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly i18n = inject(I18n);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly dias = DIAS_SEMANA;
  protected readonly labels = DIA_SEMANA_LABELS;
  protected readonly duracionMinima = DURACION_TURNO_MINIMA;
  protected readonly duracionMaxima = DURACION_TURNO_MAXIMA;

  protected readonly loading = signal(true);
  protected readonly loadError = signal<Mensaje | null>(null);
  protected readonly error = signal<Mensaje | null>(null);
  protected readonly status = signal<Mensaje | null>(null);
  protected readonly guardando = signal(false);
  protected readonly turnos = signal<Turno[]>([]);
  /** Shift being edited; null while the form adds a new one. */
  protected readonly editandoId = signal<number | null>(null);
  protected readonly form = signal<TurnoRequest>(turnoNuevo());

  /** Shifts grouped by weekday, Monday first, each day sorted by start time. */
  protected readonly porDia = computed(() =>
    DIAS_SEMANA.map((dia) => ({
      dia,
      turnos: this.turnos()
        .filter((t) => t.dia === dia)
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    })),
  );

  protected readonly duracionValida = computed(() => {
    const duracion = this.form().duracionMinutos;
    return (
      Number.isInteger(duracion) &&
      duracion >= DURACION_TURNO_MINIMA &&
      duracion <= DURACION_TURNO_MAXIMA
    );
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.turnos.set(await firstValueFrom(this.panel.getTurnos()));
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'panel.turnos.error.cargar'));
    } finally {
      this.loading.set(false);
    }
  }

  protected cambiar<K extends keyof TurnoRequest>(campo: K, valor: TurnoRequest[K]): void {
    this.form.update((form) => ({ ...form, [campo]: valor }));
  }

  protected cambiarDia(event: Event): void {
    this.cambiar('dia', (event.target as HTMLSelectElement).value as DiaSemana);
  }

  protected cambiarInicio(event: Event): void {
    this.cambiar('inicio', (event.target as HTMLInputElement).value);
  }

  protected cambiarDuracion(event: Event): void {
    this.cambiar('duracionMinutos', Number((event.target as HTMLInputElement).value));
  }

  protected editar(turno: Turno): void {
    this.error.set(null);
    this.status.set(null);
    this.editandoId.set(turno.id);
    this.form.set({ dia: turno.dia, inicio: turno.inicio, duracionMinutos: turno.duracionMinutos });
    // The form sits above the list, so focus moves to it.
    enfocarTrasRender(this.host, '#turno-dia', this.injector);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.set(turnoNuevo());
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);
    this.status.set(null);
    if (!this.form().inicio || !this.duracionValida()) {
      this.error.set({
        clave: 'panel.turnos.error.duracion',
        parametros: { min: DURACION_TURNO_MINIMA, max: DURACION_TURNO_MAXIMA },
      });
      return;
    }
    this.guardando.set(true);
    const id = this.editandoId();
    try {
      if (id === null) {
        const creado = await firstValueFrom(this.panel.crearTurno(this.form()));
        this.turnos.update((turnos) => [...turnos, creado]);
        this.status.set({ clave: 'panel.turnos.creado', parametros: this.describir(creado) });
      } else {
        const actualizado = await firstValueFrom(this.panel.actualizarTurno(id, this.form()));
        this.turnos.update((turnos) => turnos.map((t) => (t.id === id ? actualizado : t)));
        this.status.set({
          clave: 'panel.turnos.guardado',
          parametros: this.describir(actualizado),
        });
      }
      this.cancelarEdicion();
    } catch (error) {
      this.error.set(this.mensajeError(error, 'panel.turnos.error.guardar'));
    } finally {
      this.guardando.set(false);
    }
  }

  protected async quitar(turno: Turno): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const confirmado = await this.confirm().open({
      heading: this.i18n.t('panel.turnos.quitarTitulo'),
      message: this.i18n.t('panel.turnos.quitarTexto', this.describir(turno)),
      confirmLabel: this.i18n.t('panel.turnos.quitar'),
      tone: 'danger',
    });
    if (!confirmado) {
      return;
    }
    try {
      await firstValueFrom(this.panel.eliminarTurno(turno.id));
      this.turnos.update((turnos) => turnos.filter((t) => t.id !== turno.id));
      if (this.editandoId() === turno.id) {
        this.cancelarEdicion();
      }
      this.status.set({ clave: 'panel.turnos.quitado', parametros: this.describir(turno) });
    } catch (error) {
      this.error.set(this.mensajeError(error, 'panel.turnos.error.quitar'));
    }
  }

  /** Placeholders `{dia}`, `{inicio}` and `{fin}` of the shift texts. */
  private describir(turno: Turno): { dia: string; inicio: string; fin: string } {
    return { dia: this.i18n.t(DIA_SEMANA_LABELS[turno.dia]), inicio: turno.inicio, fin: turno.fin };
  }

  private mensajeError(
    error: unknown,
    fallback: 'panel.turnos.error.guardar' | 'panel.turnos.error.quitar',
  ): Mensaje {
    return (
      mensajeDeConflicto(error) ?? mensajeDeNegocio(error) ?? panelErrorMessage(error, fallback)
    );
  }
}
