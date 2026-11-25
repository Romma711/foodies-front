import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { enfocarTrasRender, PRIMER_CAMPO } from '../../../shared/a11y/enfocar';
import { apply, form, FormField, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ReservaDetailDTO, ReservaListDTO } from '../../models';
import { DisponibilidadService } from '../../services/disponibilidad.service';
import {
  espaciosDelTurno,
  sumarReservaPropia,
  turnoLleno,
  turnoSugerido,
} from '../../utils/turnos';
import { TurnoSelector } from '../turno-selector/turno-selector';
import { horariosDelDia } from '../../../restaurantes/utils/horarios';
import { EspaciosService } from '../../services/espacios.service';
import { HorariosService } from '../../services/horarios.service';
import { ReservaService } from '../../services/reserva.service';
import { formatearHora, soloFecha } from '../../utils/reserva-formato';
import {
  diaCerrado,
  espacioSinLugar,
  espacioSugerido,
  HORARIOS,
  MENSAJE_CERRADO,
  MENSAJE_FUERA_DE_HORARIO,
  MENSAJE_SIN_LUGAR,
  MENSAJE_TURNO,
  textoHorarioDelDia,
  ReservaFormModel,
  reglasReserva,
} from '../../utils/reserva-reglas';
import { EspacioSelector } from '../espacio-selector/espacio-selector';
import { TClavePipe, TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';
import { Traductor } from '@core/i18n/traducir';

/** Lets the owner change date, arrival time, party size and espacio of a PENDIENTE or ACEPTADA reservation. */
@Component({
  imports: [TClavePipe, TPipe, EspacioSelector, TurnoSelector, FormField],
  selector: 'app-reserva-edit-form',
  templateUrl: './reserva-edit-form.html',
})
export class ReservaEditForm {
  private readonly reservaService = inject(ReservaService);
  private readonly espaciosService = inject(EspaciosService);
  private readonly horariosService = inject(HorariosService);
  private readonly disponibilidadService = inject(DisponibilidadService);

  constructor() {
    // The form replaces the button that opened it, so focus moves to its first field.
    enfocarTrasRender(inject(ElementRef), PRIMER_CAMPO, inject(Injector));
    // A reservation without espacio (or with one no longer offered) gets one with room preselected.
    effect(() => {
      const espacios = this.espacios();
      const actual = untracked(() => this.model().idEspacio);
      if (espacios.length && !espacios.some((e) => String(e.id) === actual)) {
        this.model.update((model) => ({ ...model, idEspacio: espacioSugerido(espacios) }));
      }
    });
    // With shifts, keeps a shift with room chosen when the date or the party size changes.
    effect(() => {
      const turnos = this.turnos();
      const cantidad = this.model().cantidad;
      const actual = untracked(() => this.turnoElegido());
      if (this.porTurnos() && (actual === null || turnoLleno(actual, cantidad))) {
        const sugerido = turnoSugerido(turnos, cantidad);
        // Only writes on a real change, or the effect would re-run on its own write forever.
        if (sugerido !== untracked(() => this.model().idTurno)) {
          this.model.update((model) => ({ ...model, idTurno: sugerido }));
        }
      }
    });
    // Keeps the arrival time inside the opening hours when the date changes.
    effect(() => {
      const disponibles = this.horarios();
      const actual = untracked(() => this.model().horarioLlegada);
      if (disponibles.length && !disponibles.includes(actual)) {
        this.model.update((model) => ({ ...model, horarioLlegada: disponibles[0] }));
      }
    });
  }

  readonly reserva = input.required<ReservaListDTO>();

  readonly guardada = output<ReservaDetailDTO>();
  readonly cancelada = output<void>();

  protected readonly saving = this.reservaService.saving;
  protected readonly mutationError = this.reservaService.mutationError;
  private readonly i18n = inject(I18n);
  private readonly t: Traductor = (clave, parametros) => this.i18n.t(clave, parametros);

  /** The offered times, plus the current one when it is outside the usual grid. */
  private readonly grilla = computed(() => {
    const actual = formatearHora(this.reserva().horariollegada);
    return actual && !HORARIOS.includes(actual) ? [...HORARIOS, actual].sort() : HORARIOS;
  });

  /** Horario de atención del restaurante; sin franjas no hay restricción. */
  protected readonly horariosResource = rxResource({
    params: () => this.reserva().idRestaurant,
    stream: ({ params }) => this.horariosService.listar(params),
  });

  private readonly franjas = computed(() =>
    this.horariosResource.hasValue() ? this.horariosResource.value() : [],
  );

  private readonly model = linkedSignal<ReservaFormModel>(() => ({
    idEspacio: this.reserva().idEspacio === null ? '' : String(this.reserva().idEspacio),
    fechaReserva: soloFecha(this.reserva().fechaReserva),
    horarioLlegada: formatearHora(this.reserva().horariollegada),
    cantidad: this.reserva().cantidad,
    idTurno: this.reserva().idTurno === null ? '' : String(this.reserva().idTurno),
  }));

  /** Free seats per shift and espacio on the chosen date (rule D2). */
  protected readonly disponibilidadResource = rxResource({
    params: () =>
      /^\d{4}-\d{2}-\d{2}$/.test(this.model().fechaReserva)
        ? { restauranteId: this.reserva().idRestaurant, fecha: this.model().fechaReserva }
        : undefined,
    stream: ({ params }) =>
      this.disponibilidadService.consultar(params.restauranteId, params.fecha),
  });

  protected readonly porTurnos = computed(
    () => this.disponibilidadResource.hasValue() && this.disponibilidadResource.value().porTurnos,
  );

  /** Shifts of the date; on the original date the reservation's own seats count as free. */
  protected readonly turnos = computed(() => {
    if (!this.porTurnos()) {
      return [];
    }
    const turnos = this.disponibilidadResource.value()!.turnos;
    const reserva = this.reserva();
    return this.model().fechaReserva === soloFecha(reserva.fechaReserva)
      ? sumarReservaPropia(turnos, reserva.idTurno, reserva.idEspacio, reserva.cantidad)
      : turnos;
  });

  protected readonly turnoElegido = computed(
    () => this.turnos().find((turno) => String(turno.idTurno) === this.model().idTurno) ?? null,
  );

  /** Horarios de llegada que se ofrecen para la fecha elegida. */
  protected readonly horarios = computed(() =>
    horariosDelDia(this.grilla(), this.franjas(), this.model().fechaReserva),
  );

  protected readonly horarioDelDia = computed(() =>
    textoHorarioDelDia(this.franjas(), this.model().fechaReserva, this.t),
  );

  /** Espacios del restaurante y si hay lugar en cada uno para la fecha y cantidad elegidas. */
  protected readonly espaciosResource = rxResource({
    params: () =>
      this.porTurnos()
        ? undefined
        : {
            restauranteId: this.reserva().idRestaurant,
            fecha: this.model().fechaReserva,
            cantidad: this.model().cantidad,
          },
    stream: ({ params }) =>
      this.espaciosService.listar(params.restauranteId, params.fecha, params.cantidad),
  });

  protected readonly espacios = computed(() => {
    if (this.porTurnos()) {
      return espaciosDelTurno(this.turnoElegido(), this.model().cantidad);
    }
    return this.espaciosResource.hasValue() ? this.espaciosResource.value() : [];
  });

  protected readonly editForm = form(this.model, (path) => {
    apply(path, reglasReserva);
    validate(path.fechaReserva, ({ value }) =>
      diaCerrado(this.franjas(), value()) ? { kind: 'cerrado', message: MENSAJE_CERRADO } : null,
    );
    validate(path.horarioLlegada, ({ value }) =>
      !this.porTurnos() && this.horarios().length && !this.horarios().includes(value())
        ? { kind: 'fueraDeHorario', message: MENSAJE_FUERA_DE_HORARIO }
        : null,
    );
    // The reservation itself takes room in its current espacio, so only other espacios can be "full".
    validate(path.idEspacio, ({ value }) =>
      (this.porTurnos() || value() !== String(this.reserva().idEspacio)) &&
      espacioSinLugar(this.espacios(), value())
        ? { kind: 'sinLugar', message: MENSAJE_SIN_LUGAR }
        : null,
    );
    validate(path.idTurno, ({ value }) =>
      this.porTurnos() && !value() ? { kind: 'turno', message: MENSAJE_TURNO } : null,
    );
  });

  /** Party-size error, shown as soon as the user changes the value instead of waiting for blur. */
  protected readonly errorCantidad = computed(() => {
    const campo = this.editForm.cantidad();
    return campo.dirty() || campo.touched() ? (campo.errors()[0] ?? null) : null;
  });

  /** Unique ids per reservation, so labels never point at another card's fields. */
  protected readonly ids = computed(() => {
    const prefijo = `editar-reserva-${this.reserva().id}`;
    return {
      fecha: `${prefijo}-fecha`,
      horario: `${prefijo}-horario`,
      cantidad: `${prefijo}-cantidad`,
      espacio: `${prefijo}-espacio`,
      turno: `${prefijo}-turno`,
    };
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.editForm, async () => {
      try {
        const actualizada = await firstValueFrom(
          this.reservaService.modificar(this.reserva().id, {
            fechaReserva: this.model().fechaReserva,
            horarioLlegada: this.turnoElegido()?.inicio ?? this.model().horarioLlegada,
            cantidad: this.model().cantidad,
            idEspacio: Number(this.model().idEspacio),
            ...(this.porTurnos() ? { idTurno: Number(this.model().idTurno) } : {}),
          }),
        );
        this.guardada.emit(actualizada);
      } catch {
        // The service exposes the backend message through `mutationError`.
      }
      return undefined;
    });
  }
}
