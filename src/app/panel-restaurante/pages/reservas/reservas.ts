import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import {
  formatearDia,
  panelErrorMessage,
  parseLocalDate,
  toIsoDate,
} from '../../utils/panel-errors';
import { EstadoReserva, ReservaPanel } from '../../models/panel.models';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import { TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';
import { Clave, Mensaje } from '@core/i18n/traducir';

type Filtro = EstadoReserva | 'TODAS';

interface GrupoPorDia {
  fecha: string;
  dia: Date;
  reservas: ReservaPanel[];
}

/** Translation keys of each status as the restaurant sees it. */
export const ESTADO_LABEL: Record<EstadoReserva, Clave> = {
  PENDIENTE: 'panel.reservas.estado.PENDIENTE',
  ACEPTADA: 'panel.reservas.estado.ACEPTADA',
  CANCELADA: 'panel.reservas.estado.CANCELADA',
};

@Component({
  imports: [TPipe, ConfirmDialog],
  selector: 'app-reservas',
  styleUrl: './reservas.css',
  templateUrl: './reservas.html',
})
export class Reservas implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly i18n = inject(I18n);
  private readonly confirm = viewChild.required(ConfirmDialog);
  private readonly today = toIsoDate(new Date());

  protected readonly estadoLabel = ESTADO_LABEL;
  protected formatearDia(dia: Date): string {
    return formatearDia(dia, this.i18n.locale());
  }
  protected readonly loading = signal(true);
  protected readonly loadError = signal<Mensaje | null>(null);
  protected readonly error = signal<Mensaje | null>(null);
  protected readonly status = signal<Mensaje | null>(null);
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
      {
        value: 'PENDIENTE' as Filtro,
        label: 'panel.reservas.filtro.PENDIENTE' as Clave,
        count: count('PENDIENTE'),
      },
      {
        value: 'ACEPTADA' as Filtro,
        label: 'panel.reservas.filtro.ACEPTADA' as Clave,
        count: count('ACEPTADA'),
      },
      {
        value: 'CANCELADA' as Filtro,
        label: 'panel.reservas.filtro.CANCELADA' as Clave,
        count: count('CANCELADA'),
      },
      {
        value: 'TODAS' as Filtro,
        label: 'panel.reservas.filtro.TODAS' as Clave,
        count: visibles.length,
      },
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
      this.loadError.set(panelErrorMessage(error, 'panel.reservas.error.cargar'));
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
    const quien = this.i18n.t('panel.reservas.quien', {
      nombre: reserva.nombreCliente,
      cantidad: this.i18n.t(reserva.cantidad === 1 ? 'reserva.persona' : 'reserva.personas', {
        n: reserva.cantidad,
      }),
      hora: this.hora(reserva),
    });
    const confirmed = await this.confirm().open(
      estado === 'ACEPTADA'
        ? {
            heading: this.i18n.t('panel.reservas.aceptarTitulo'),
            message: quien,
            confirmLabel: this.i18n.t('panel.reservas.aceptar'),
          }
        : {
            heading: this.i18n.t('panel.reservas.cancelarTitulo'),
            message: this.i18n.t('panel.reservas.cancelarTexto', { quien }),
            confirmLabel: this.i18n.t('misReservas.cancelarReserva'),
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
      this.status.set({
        clave: estado === 'ACEPTADA' ? 'panel.reservas.aceptada' : 'panel.reservas.cancelada',
        parametros: { nombre: reserva.nombreCliente },
      });
    } catch (error) {
      this.error.set(panelErrorMessage(error, 'panel.reservas.error.actualizar'));
    } finally {
      this.updatingId.set(null);
    }
  }
}
