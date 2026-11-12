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
import { enfocarTrasRender, PRIMER_CAMPO } from '../../../../shared/a11y/enfocar';
import { ReservaDetailDTO } from '../../models';
import { EspaciosService } from '../../services/espacios.service';
import { ReservaService } from '../../services/reserva.service';
import {
  espacioSinLugar,
  espacioSugerido,
  fechaLocal,
  HORARIOS,
  MENSAJE_SIN_LUGAR,
  ReservaFormModel,
  reglasReserva,
} from '../../utils/reserva-reglas';
import { EspacioSelector } from '../espacio-selector/espacio-selector';

@Component({
  imports: [EspacioSelector, FormField],
  selector: 'app-reserva-form',
  templateUrl: './reserva-form.html',
})
export class ReservaForm {
  private readonly reservaService = inject(ReservaService);
  private readonly espaciosService = inject(EspaciosService);

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
  }

  readonly restauranteId = input.required<number>();
  readonly usuarioId = input.required<number>();

  readonly creada = output<ReservaDetailDTO>();
  readonly cancelada = output<void>();

  protected readonly saving = this.reservaService.saving;
  protected readonly mutationError = this.reservaService.mutationError;
  protected readonly horarios = HORARIOS;

  private readonly model = signal<ReservaFormModel>({
    idEspacio: '',
    fechaReserva: fechaLocal(1),
    horarioLlegada: '20:00',
    cantidad: 2,
  });

  /** Espacios del restaurante y si hay lugar en cada uno para la fecha y cantidad elegidas. */
  protected readonly espaciosResource = rxResource({
    params: () => ({
      restauranteId: this.restauranteId(),
      fecha: this.model().fechaReserva,
      cantidad: this.model().cantidad,
    }),
    stream: ({ params }) =>
      this.espaciosService.listar(params.restauranteId, params.fecha, params.cantidad),
  });

  protected readonly espacios = computed(() =>
    this.espaciosResource.hasValue() ? this.espaciosResource.value() : [],
  );

  protected readonly reservaForm = form(this.model, (path) => {
    apply(path, reglasReserva);
    validate(path.idEspacio, ({ value }) =>
      espacioSinLugar(this.espacios(), value())
        ? { kind: 'sinLugar', message: MENSAJE_SIN_LUGAR }
        : null,
    );
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.reservaForm, async () => {
      try {
        const creada = await firstValueFrom(
          this.reservaService.crear({
            cantidad: this.model().cantidad,
            fechaReserva: this.model().fechaReserva,
            horarioLlegada: this.model().horarioLlegada,
            idUsuario: this.usuarioId(),
            idRestaurant: this.restauranteId(),
            idEspacio: Number(this.model().idEspacio),
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
