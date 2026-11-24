import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { apply, form, FormField, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { enfocarTrasRender, PRIMER_CAMPO } from '../../../shared/a11y/enfocar';
import { ReservaDetailDTO } from '../../models';
import { TurnoDisponible } from '../../models/disponibilidad';
import { DisponibilidadService } from '../../services/disponibilidad.service';
import { ListaEsperaService } from '../../../lista-espera/services/lista-espera.service';
import { espaciosDelTurno, turnoLleno, turnoSugerido } from '../../utils/turnos';
import { TurnoSelector } from '../turno-selector/turno-selector';
import { horariosDelDia } from '../../../restaurantes/utils/horarios';
import { EspaciosService } from '../../services/espacios.service';
import { HorariosService } from '../../services/horarios.service';
import { ReservaService } from '../../services/reserva.service';
import {
  diaCerrado,
  espacioSinLugar,
  espacioSugerido,
  fechaLocal,
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
import { Mensaje, Traductor } from '@core/i18n/traducir';

@Component({
  imports: [TClavePipe, TPipe, EspacioSelector, TurnoSelector, FormField],
  selector: 'app-reserva-form',
  templateUrl: './reserva-form.html',
})
export class ReservaForm {
  private readonly reservaService = inject(ReservaService);
  private readonly espaciosService = inject(EspaciosService);
  private readonly horariosService = inject(HorariosService);
  private readonly disponibilidadService = inject(DisponibilidadService);
  private readonly listaEsperaService = inject(ListaEsperaService);

  constructor() {
    // The form replaces the button that opened it, so focus moves to its first field.
    enfocarTrasRender(inject(ElementRef), PRIMER_CAMPO, inject(Injector));
    // Preselects an espacio with room when none is chosen or the chosen one is no longer offered.
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

  readonly restauranteId = input.required<number>();
  readonly usuarioId = input.required<number>();

  readonly creada = output<ReservaDetailDTO>();
  readonly cancelada = output<void>();

  protected readonly saving = this.reservaService.saving;
  protected readonly mutationError = this.reservaService.mutationError;
  private readonly i18n = inject(I18n);
  private readonly t: Traductor = (clave, parametros) => this.i18n.t(clave, parametros);

  private readonly model = signal<ReservaFormModel>({
    idEspacio: '',
    fechaReserva: fechaLocal(1),
    horarioLlegada: '20:00',
    cantidad: 2,
    idTurno: '',
  });

  /** Horario de atención del restaurante; sin franjas no hay restricción. */
  protected readonly horariosResource = rxResource({
    params: () => this.restauranteId(),
    stream: ({ params }) => this.horariosService.listar(params),
  });

  private readonly franjas = computed(() =>
    this.horariosResource.hasValue() ? this.horariosResource.value() : [],
  );

  /** Horarios de llegada que se ofrecen para la fecha elegida. */
  protected readonly horarios = computed(() =>
    horariosDelDia(HORARIOS, this.franjas(), this.model().fechaReserva),
  );

  protected readonly horarioDelDia = computed(() =>
    textoHorarioDelDia(this.franjas(), this.model().fechaReserva, this.t),
  );

  /** Free seats per shift and espacio on the chosen date (rule D2). */
  protected readonly disponibilidadResource = rxResource({
    params: () =>
      /^\d{4}-\d{2}-\d{2}$/.test(this.model().fechaReserva)
        ? { restauranteId: this.restauranteId(), fecha: this.model().fechaReserva }
        : undefined,
    stream: ({ params }) =>
      this.disponibilidadService.consultar(params.restauranteId, params.fecha),
  });

  /** True when the restaurant works with shifts: the shift replaces the arrival time. */
  protected readonly porTurnos = computed(
    () => this.disponibilidadResource.hasValue() && this.disponibilidadResource.value().porTurnos,
  );

  protected readonly turnos = computed(() =>
    this.porTurnos() ? this.disponibilidadResource.value()!.turnos : [],
  );

  protected readonly turnoElegido = computed(
    () => this.turnos().find((turno) => String(turno.idTurno) === this.model().idTurno) ?? null,
  );

  /** Espacios del restaurante y si hay lugar en cada uno para la fecha y cantidad elegidas. */
  protected readonly espaciosResource = rxResource({
    params: () =>
      this.porTurnos()
        ? undefined
        : {
            restauranteId: this.restauranteId(),
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

  /** Without shifts, the waitlist is offered when no espacio has room for that date and party. */
  protected readonly todoCompleto = computed(
    () =>
      !this.porTurnos() &&
      this.espacios().length > 0 &&
      this.espacios().every((espacio) => espacio.hayLugar === false),
  );

  protected readonly anotando = this.listaEsperaService.saving;
  protected readonly errorLista = this.listaEsperaService.error;
  /** Confirmation shown after joining a waitlist. */
  protected readonly avisoLista = signal<Mensaje | null>(null);

  protected readonly reservaForm = form(this.model, (path) => {
    apply(path, reglasReserva);
    validate(path.fechaReserva, ({ value }) =>
      diaCerrado(this.franjas(), value()) ? { kind: 'cerrado', message: MENSAJE_CERRADO } : null,
    );
    validate(path.horarioLlegada, ({ value }) =>
      !this.porTurnos() && this.horarios().length && !this.horarios().includes(value())
        ? { kind: 'fueraDeHorario', message: MENSAJE_FUERA_DE_HORARIO }
        : null,
    );
    validate(path.idEspacio, ({ value }) =>
      espacioSinLugar(this.espacios(), value())
        ? { kind: 'sinLugar', message: MENSAJE_SIN_LUGAR }
        : null,
    );
    validate(path.idTurno, ({ value }) =>
      this.porTurnos() && !value() ? { kind: 'turno', message: MENSAJE_TURNO } : null,
    );
  });

  /** Joins the waitlist of a full shift (or of the whole day when there are no shifts). */
  protected async anotarEnLista(turno: TurnoDisponible | null): Promise<void> {
    this.avisoLista.set(null);
    const hora = turno?.inicio ?? this.model().horarioLlegada;
    try {
      await firstValueFrom(
        this.listaEsperaService.anotar({
          idRestaurant: this.restauranteId(),
          fechaReserva: this.model().fechaReserva,
          horarioLlegada: hora,
          idTurno: turno?.idTurno ?? null,
          cantidad: this.model().cantidad,
        }),
      );
      this.avisoLista.set({ clave: 'listaEspera.anotado', parametros: { hora } });
    } catch {
      // The service exposes the backend message through `error`.
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.reservaForm, async () => {
      try {
        const creada = await firstValueFrom(
          this.reservaService.crear({
            cantidad: this.model().cantidad,
            fechaReserva: this.model().fechaReserva,
            horarioLlegada: this.turnoElegido()?.inicio ?? this.model().horarioLlegada,
            idUsuario: this.usuarioId(),
            idRestaurant: this.restauranteId(),
            idEspacio: Number(this.model().idEspacio),
            ...(this.porTurnos() ? { idTurno: Number(this.model().idTurno) } : {}),
          }),
        );
        this.creada.emit(creada);
      } catch {
        // The service exposes the backend message through `mutationError`.
      }
      return undefined;
    });
  }
}
