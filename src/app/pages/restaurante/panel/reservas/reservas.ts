import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { formatearDia, panelErrorMessage, parseLocalDate, toIsoDate } from '../panel-errors';
import { EstadoReserva, ReservaPanel } from '../panel.models';
import { RestaurantePanelService } from '../restaurante-panel.service';

type Filtro = EstadoReserva | 'TODAS';

interface GrupoPorDia {
  fecha: string;
  dia: Date;
  reservas: ReservaPanel[];
}

export const ESTADO_LABEL: Record<EstadoReserva, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  CANCELADA: 'Cancelada',
};

@Component({
  imports: [ConfirmDialog],
  selector: 'app-reservas',
  styleUrl: './reservas.css',
  templateUrl: './reservas.html',
})
export class Reservas implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly today = toIsoDate(new Date());

  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly formatearDia = formatearDia;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly reservas = signal<ReservaPanel[]>([]);
  protected readonly filtro = signal<Filtro>('PENDIENTE');
  protected readonly mostrarPasadas = signal(false);
  /** Id de la reserva que se está actualizando, para deshabilitar solo sus botones. */
  protected readonly updatingId = signal<number | null>(null);

  private readonly visibles = computed(() =>
    this.reservas().filter((r) => this.mostrarPasadas() || r.fecha >= this.today),
  );

  protected readonly filtros = computed(() => {
    const visibles = this.visibles();
    const count = (estado: EstadoReserva) => visibles.filter((r) => r.estado === estado).length;
    return [
      { value: 'PENDIENTE' as Filtro, label: 'Pendientes', count: count('PENDIENTE') },
      { value: 'ACEPTADA' as Filtro, label: 'Aceptadas', count: count('ACEPTADA') },
      { value: 'CANCELADA' as Filtro, label: 'Canceladas', count: count('CANCELADA') },
      { value: 'TODAS' as Filtro, label: 'Todas', count: visibles.length },
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
      this.loadError.set(panelErrorMessage(error, 'No pudimos cargar tus reservas.'));
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
    const quien = `${reserva.nombreCliente}, ${reserva.cantidad} ${reserva.cantidad === 1 ? 'persona' : 'personas'} a las ${this.hora(reserva)}`;
    const confirmed = await this.confirm().open(
      estado === 'ACEPTADA'
        ? { heading: '¿Aceptar esta reserva?', message: quien, confirmLabel: 'Aceptar' }
        : {
            heading: '¿Cancelar esta reserva?',
            message: `${quien}. El cliente va a perder esta reserva.`,
            confirmLabel: 'Cancelar reserva',
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
        `Reserva de ${reserva.nombreCliente} ${estado === 'ACEPTADA' ? 'aceptada' : 'cancelada'}.`,
      );
    } catch (error) {
      this.error.set(
        panelErrorMessage(error, 'No pudimos actualizar la reserva. Intentá de nuevo.'),
      );
    } finally {
      this.updatingId.set(null);
    }
  }
}
