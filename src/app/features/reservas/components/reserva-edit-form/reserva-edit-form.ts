import { Component, computed, inject, input, linkedSignal, output } from '@angular/core';
import { form, FormField, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ReservaDetailDTO, ReservaListDTO } from '../../models';
import { ReservaService } from '../../services/reserva.service';
import { formatearHora } from '../../utils/reserva-formato';
import { HORARIOS, ReservaFormModel, reglasReserva } from '../../utils/reserva-reglas';

/** `yyyy-MM-dd` part of the date the API returns (ISO date or date-time). */
function soloFecha(value: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';
}

/** Lets the owner change date, arrival time and party size of a PENDIENTE or ACEPTADA reservation. */
@Component({
  imports: [FormField],
  selector: 'app-reserva-edit-form',
  templateUrl: './reserva-edit-form.html',
})
export class ReservaEditForm {
  private readonly reservaService = inject(ReservaService);

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
    fechaReserva: soloFecha(this.reserva().fechaReserva),
    horarioLlegada: formatearHora(this.reserva().horariollegada),
    cantidad: this.reserva().cantidad,
  }));

  protected readonly editForm = form(this.model, reglasReserva);

  /** Unique ids per reservation, so labels never point at another card's fields. */
  protected readonly ids = computed(() => {
    const prefijo = `editar-reserva-${this.reserva().id}`;
    return {
      fecha: `${prefijo}-fecha`,
      horario: `${prefijo}-horario`,
      cantidad: `${prefijo}-cantidad`,
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
