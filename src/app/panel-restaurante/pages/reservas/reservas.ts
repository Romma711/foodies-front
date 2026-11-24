import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import {
  formatearDia,
  mensajeDeNegocio,
  panelErrorMessage,
  parseLocalDate,
  toIsoDate,
} from '../../utils/panel-errors';
import { EstadoReserva, ReservaPanel } from '../../models/panel.models';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import { AccionReserva, accionesDe } from '../../utils/reserva-acciones';
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
  RECHAZADA: 'panel.reservas.estado.RECHAZADA',
  ASISTIO: 'panel.reservas.estado.ASISTIO',
  NO_ASISTIO: 'panel.reservas.estado.NO_ASISTIO',
  VENCIDA: 'panel.reservas.estado.VENCIDA',
};

/** Button text, confirmation and success message of each panel action. */
const ACCIONES: Record<
  AccionReserva,
  { boton: Clave; aria: Clave; titulo: Clave; confirmar: Clave; hecho: Clave; peligro: boolean }
> = {
  ACEPTADA: {
    boton: 'panel.reservas.aceptar',
    aria: 'panel.reservas.aceptarAria',
    titulo: 'panel.reservas.aceptarTitulo',
    confirmar: 'panel.reservas.aceptar',
    hecho: 'panel.reservas.aceptada',
    peligro: false,
  },
  RECHAZADA: {
    boton: 'panel.reservas.rechazar',
    aria: 'panel.reservas.rechazarAria',
    titulo: 'panel.reservas.rechazarTitulo',
    confirmar: 'panel.reservas.rechazar',
    hecho: 'panel.reservas.rechazada',
    peligro: true,
  },
  CANCELADA: {
    boton: 'comun.cancelar',
    aria: 'panel.reservas.cancelarAria',
    titulo: 'panel.reservas.cancelarTitulo',
    confirmar: 'misReservas.cancelarReserva',
    hecho: 'panel.reservas.cancelada',
    peligro: true,
  },
  ASISTIO: {
    boton: 'panel.reservas.asistio',
    aria: 'panel.reservas.asistioAria',
    titulo: 'panel.reservas.asistioTitulo',
    confirmar: 'panel.reservas.asistio',
    hecho: 'panel.reservas.marcadaAsistio',
    peligro: false,
  },
  NO_ASISTIO: {
    boton: 'panel.reservas.noAsistio',
    aria: 'panel.reservas.noAsistioAria',
    titulo: 'panel.reservas.noAsistioTitulo',
    confirmar: 'panel.reservas.noAsistio',
    hecho: 'panel.reservas.marcadaNoAsistio',
    peligro: true,
  },
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
  protected readonly acciones = ACCIONES;
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

  /** Past reservations stay visible while their attendance can still be marked. */
  private readonly visibles = computed(() =>
    this.reservas().filter(
      (r) => this.mostrarPasadas() || r.fecha >= this.today || accionesDe(r).includes('ASISTIO'),
    ),
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

  /** Actions allowed right now for the reservation (they depend on its arrival time). */
  protected accionesDe(reserva: ReservaPanel): AccionReserva[] {
    return accionesDe(reserva);
  }

  protected isToday(fecha: string): boolean {
    return fecha === this.today;
  }

  protected async cambiarEstado(reserva: ReservaPanel, estado: AccionReserva): Promise<void> {
    this.error.set(null);
    this.status.set(null);
    const quien = this.i18n.t('panel.reservas.quien', {
      nombre: reserva.nombreCliente,
      cantidad: this.i18n.t(reserva.cantidad === 1 ? 'reserva.persona' : 'reserva.personas', {
        n: reserva.cantidad,
      }),
      hora: this.hora(reserva),
    });
    const accion = ACCIONES[estado];
    const confirmed = await this.confirm().open({
      heading: this.i18n.t(accion.titulo),
      message:
        estado === 'CANCELADA'
          ? this.i18n.t('panel.reservas.cancelarTexto', { quien })
          : estado === 'RECHAZADA'
            ? this.i18n.t('panel.reservas.rechazarTexto', { quien })
            : estado === 'NO_ASISTIO'
              ? this.i18n.t('panel.reservas.noAsistioTexto', { quien })
              : quien,
      confirmLabel: this.i18n.t(accion.confirmar),
      ...(accion.peligro ? { tone: 'danger' as const } : {}),
    });
    if (!confirmed) {
      return;
    }
    this.updatingId.set(reserva.id);
    try {
      const updated = await firstValueFrom(this.panel.cambiarEstado(reserva.id, estado));
      this.reservas.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
      this.status.set({ clave: accion.hecho, parametros: { nombre: reserva.nombreCliente } });
    } catch (error) {
      this.error.set(
        mensajeDeNegocio(error) ?? panelErrorMessage(error, 'panel.reservas.error.actualizar'),
      );
    } finally {
      this.updatingId.set(null);
    }
  }
}
