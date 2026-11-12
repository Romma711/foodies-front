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
import { enfocarTrasRender, PRIMER_CAMPO } from '../../../../shared/a11y/enfocar';
import { apply, form, FormField, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ReservaDetailDTO, ReservaListDTO } from '../../models';
import { EspaciosService } from '../../services/espacios.service';
import { ReservaService } from '../../services/reserva.service';
import { formatearHora } from '../../utils/reserva-formato';
import {
  espacioSinLugar,
  espacioSugerido,
  HORARIOS,
  MENSAJE_SIN_LUGAR,
  ReservaFormModel,
  reglasReserva,
} from '../../utils/reserva-reglas';
import { EspacioSelector } from '../espacio-selector/espacio-selector';

/** `yyyy-MM-dd` part of the date the API returns (ISO date or date-time). */
function soloFecha(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}

/** Lets the owner change date, arrival time, party size and espacio of a PENDIENTE or ACEPTADA reservation. */
@Component({
  imports: [EspacioSelector, FormField],
  selector: 'app-reserva-edit-form',
  templateUrl: './reserva-edit-form.html',
})
export class ReservaEditForm {
  private readonly reservaService = inject(ReservaService);
  private readonly espaciosService = inject(EspaciosService);

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
  }

  readonly reserva = input.required<ReservaListDTO>();

  readonly guardada = output<ReservaDetailDTO>();
  readonly cancelada = output<void>();

  protected readonly saving = this.reservaService.saving;
  protected readonly mutationError = this.reservaService.mutationError;

  /** The offered times, plus the current one when it is outside the usual grid. */
  protected readonly horarios = computed(() => {
    const actual = formatearHora(this.reserva().horariollegada);
    return actual && !HORARIOS.includes(actual) ? [...HORARIOS, actual].sort() : HORARIOS;
  });

  private readonly model = linkedSignal<ReservaFormModel>(() => ({
    idEspacio: this.reserva().idEspacio === null ? '' : String(this.reserva().idEspacio),
    fechaReserva: soloFecha(this.reserva().fechaReserva),
    horarioLlegada: formatearHora(this.reserva().horariollegada),
    cantidad: this.reserva().cantidad,
  }));

  /** Espacios del restaurante y si hay lugar en cada uno para la fecha y cantidad elegidas. */
  protected readonly espaciosResource = rxResource({
    params: () => ({
      restauranteId: this.reserva().idRestaurant,
      fecha: this.model().fechaReserva,
      cantidad: this.model().cantidad,
    }),
    stream: ({ params }) =>
      this.espaciosService.listar(params.restauranteId, params.fecha, params.cantidad),
  });

  protected readonly espacios = computed(() =>
    this.espaciosResource.hasValue() ? this.espaciosResource.value() : [],
  );

  protected readonly editForm = form(this.model, (path) => {
    apply(path, reglasReserva);
    // The reservation itself takes room in its current espacio, so only other espacios can be "full".
    validate(path.idEspacio, ({ value }) =>
      value() !== String(this.reserva().idEspacio) && espacioSinLugar(this.espacios(), value())
        ? { kind: 'sinLugar', message: MENSAJE_SIN_LUGAR }
        : null,
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
    };
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.editForm, async () => {
      try {
        const actualizada = await firstValueFrom(
          this.reservaService.modificar(this.reserva().id, {
            fechaReserva: this.model().fechaReserva,
            horarioLlegada: this.model().horarioLlegada,
            cantidad: this.model().cantidad,
            idEspacio: Number(this.model().idEspacio),
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
