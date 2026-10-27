import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { panelErrorMessage, parseLocalDate, toIsoDate } from '../panel-errors';
import { EstadoReserva, ReservaPanel } from '../panel.models';
import { RestaurantePanelService } from '../restaurante-panel.service';

type Filtro = EstadoReserva | 'TODAS';

interface GrupoPorDia {
  fecha: string;
  dia: Date;
  reservas: ReservaPanel[];
}

export const ESTADO_LABEL: Record<EstadoReserva, string> = {
  PENDIENTE: 'Pending',
  ACEPTADA: 'Accepted',
  CANCELADA: 'Cancelled',
};

@Component({
  imports: [ConfirmDialog, DatePipe],
  selector: 'app-reservas',
  styleUrl: './reservas.css',
  templateUrl: './reservas.html',
})
export class Reservas implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly today = toIsoDate(new Date());

  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly reservas = signal<ReservaPanel[]>([]);
  protected readonly filtro = signal<Filtro>('PENDIENTE');
  protected readonly mostrarPasadas = signal(false);
  /** Id of the reservation being updated, to disable only its buttons. */
  protected readonly updatingId = signal<number | null>(null);

  private readonly visibles = computed(() =>
    this.reservas().filter((r) => this.mostrarPasadas() || r.fecha >= this.today),
  );

  protected readonly filtros = computed(() => {
    const visibles = this.visibles();
    const count = (estado: EstadoReserva) => visibles.filter((r) => r.estado === estado).length;
    return [
      { value: 'PENDIENTE' as Filtro, label: 'Pending', count: count('PENDIENTE') },
      { value: 'ACEPTADA' as Filtro, label: 'Accepted', count: count('ACEPTADA') },
      { value: 'CANCELADA' as Filtro, label: 'Cancelled', count: count('CANCELADA') },
      { value: 'TODAS' as Filtro, label: 'All', count: visibles.length },
    ];
  });

  protected readonly grupos = computed<GrupoPorDia[]>(() => {
    const filtro = this.filtro();
    const porDia = new Map<string, ReservaPanel[]>();
    for (const reserva of this.visibles()) {
      if (filtro === 'TODAS' || reserva.estado === filtro) {
        porDia.set(reserva.fecha, [...(porDia.get(reserva.fecha) ?? []), reserva]);
      }
    }
    return [...porDia.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, reservas]) => ({
        fecha,
        dia: parseLocalDate(fecha),
        reservas: [...reservas].sort((a, b) => a.horarioLlegada.localeCompare(b.horarioLlegada)),
      }));
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.reservas.set(await firstValueFrom(this.panel.getReservas()));
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'Could not load your reservations.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected hora(reserva: ReservaPanel): string {
    return reserva.horarioLlegada.slice(0, 5);
  }

  protected isToday(fecha: string): boolean {
    return fecha === this.today;
  }

  protected async cambiarEstado(
    reserva: ReservaPanel,
    estado: Exclude<EstadoReserva, 'PENDIENTE'>,
  ): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const quien = `${reserva.nombreCliente}, ${reserva.cantidad} people at ${this.hora(reserva)}`;
    const confirmed = await this.confirm().open(
      estado === 'ACEPTADA'
        ? { heading: 'Accept this reservation?', message: quien, confirmLabel: 'Accept' }
        : {
            heading: 'Cancel this reservation?',
            message: `${quien}. The customer will lose this reservation.`,
            confirmLabel: 'Cancel reservation',
            tone: 'danger',
          },
    );
    if (!confirmed) {
      return;
    }
    this.updatingId.set(reserva.id);
    try {
      const updated = await firstValueFrom(this.panel.cambiarEstado(reserva.id, estado));
      this.reservas.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
      this.status.set(
        `Reservation for ${reserva.nombreCliente} ${estado === 'ACEPTADA' ? 'accepted' : 'cancelled'}.`,
      );
    } catch (error) {
      this.error.set(
        panelErrorMessage(error, 'Could not update the reservation. Please try again.'),
      );
    } finally {
      this.updatingId.set(null);
    }
  }
}
