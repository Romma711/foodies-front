import { Component, ElementRef, inject, Injector, input, output, signal } from '@angular/core';
import { enfocarTrasRender, PRIMER_CAMPO } from '../../../../shared/a11y/enfocar';
import { form, FormField, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ReservaDetailDTO } from '../../models';
import { ReservaService } from '../../services/reserva.service';
import { fechaLocal, HORARIOS, ReservaFormModel, reglasReserva } from '../../utils/reserva-reglas';

@Component({
  imports: [FormField],
  selector: 'app-reserva-form',
  templateUrl: './reserva-form.html',
})
export class ReservaForm {
  private readonly reservaService = inject(ReservaService);

  constructor() {
    // The form replaces the button that opened it, so focus moves to its first field.
    enfocarTrasRender(inject(ElementRef), PRIMER_CAMPO, inject(Injector));
  }

  readonly restauranteId = input.required<number>();
  readonly usuarioId = input.required<number>();

  readonly creada = output<ReservaDetailDTO>();
  readonly cancelada = output<void>();

  protected readonly saving = this.reservaService.saving;
  protected readonly mutationError = this.reservaService.mutationError;
  protected readonly horarios = HORARIOS;

  private readonly model = signal<ReservaFormModel>({
    fechaReserva: fechaLocal(1),
    horarioLlegada: '20:00',
    cantidad: 2,
  });

  protected readonly reservaForm = form(this.model, reglasReserva);

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
