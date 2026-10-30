import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ReservaDetailDTO } from '../../models';
import { ReservaService } from '../../services/reserva.service';

interface ReservaFormModel {
  fechaReserva: string;
  horarioLlegada: string;
  cantidad: number;
}

const HORARIOS = Array.from({ length: 23 }, (_, index) => {
  const minutos = 12 * 60 + index * 30;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
});

function fechaLocal(diasDesdeHoy: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

@Component({
  imports: [FormField],
  selector: 'app-reserva-form',
  templateUrl: './reserva-form.html',
})
export class ReservaForm {
  private readonly reservaService = inject(ReservaService);

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

  protected readonly reservaForm = form(this.model, (path) => {
    required(path.fechaReserva, { message: 'Elegí una fecha.' });
    validate(path.fechaReserva, ({ value }) => {
      const fecha = value();
      if (!fecha) {
        return null;
      }
      const seleccionada = new Date(`${fecha}T00:00:00`);
      if (Number.isNaN(seleccionada.getTime())) {
        return { kind: 'fechaInvalida', message: 'Elegí una fecha válida.' };
      }
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (seleccionada < hoy) {
        return { kind: 'fechaPasada', message: 'La fecha no puede ser anterior a hoy.' };
      }
      const limite = new Date(hoy);
      limite.setMonth(limite.getMonth() + 3);
      if (seleccionada > limite) {
        return {
          kind: 'fechaLimite',
          message: 'Solo podés reservar hasta 3 meses adelante.',
        };
      }
      return null;
    });
    required(path.horarioLlegada, { message: 'Elegí un horario.' });
    required(path.cantidad, { message: 'Indicá cuántas personas.' });
    validate(path.cantidad, ({ value }) => {
      const cantidad = value();
      if (cantidad === null || cantidad === undefined) {
        return null;
      }
      if (cantidad < 1) {
        return { kind: 'min', message: 'Reservá al menos para 1 persona.' };
      }
      return null;
    });
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
