import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { I18n } from '@core/i18n/i18n.service';
import { TPipe } from '@core/i18n/t.pipe';
import { Clave, Mensaje } from '@core/i18n/traducir';
import { EntradaListaEsperaPanel, EstadoListaEsperaPanel } from '../../models/panel.models';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import {
  formatearDia,
  formatearFechaHora,
  panelErrorMessage,
  parseLocalDate,
  toIsoDate,
} from '../../utils/panel-errors';

/** Translation keys of each waitlist state as the restaurant sees it. */
const ESTADO_LABEL: Record<EstadoListaEsperaPanel, Clave> = {
  ESPERANDO: 'panel.listaEspera.estado.ESPERANDO',
  NOTIFICADA: 'panel.listaEspera.estado.NOTIFICADA',
};

interface GrupoPorDia {
  fecha: string;
  dia: Date;
  entradas: EntradaListaEsperaPanel[];
}

/**
 * Read-only waitlist of the restaurant (S7d, D23): who is waiting for a place, for which day and
 * shift, and whether the first free place was already offered by email. Without a date it shows
 * today and the coming days; the date filter asks the server for one day.
 */
@Component({
  imports: [TPipe],
  selector: 'app-lista-espera-panel',
  styleUrl: './lista-espera.css',
  templateUrl: './lista-espera.html',
})
export class ListaEsperaPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly i18n = inject(I18n);
  private readonly today = toIsoDate(new Date());

  protected readonly estadoLabel = ESTADO_LABEL;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<Mensaje | null>(null);
  protected readonly entradas = signal<EntradaListaEsperaPanel[]>([]);
  /** Day filter (`yyyy-MM-dd`); empty shows today and the coming days. */
  protected readonly fecha = signal('');

  /** Entries grouped by day; the server already orders them by date, time and sign-up. */
  protected readonly grupos = computed<GrupoPorDia[]>(() => {
    const porDia = new Map<string, EntradaListaEsperaPanel[]>();
    for (const entrada of this.entradas()) {
      porDia.set(entrada.fecha, [...(porDia.get(entrada.fecha) ?? []), entrada]);
    }
    return [...porDia.entries()].map(([fecha, entradas]) => ({
      fecha,
      dia: parseLocalDate(fecha),
      entradas,
    }));
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.entradas.set(
        (await firstValueFrom(this.panel.getListaEspera(this.fecha() || undefined))) ?? [],
      );
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'panel.listaEspera.error'));
    } finally {
      this.loading.set(false);
    }
  }

  protected filtrarPorFecha(evento: Event): void {
    this.fecha.set((evento.target as HTMLInputElement).value);
    void this.load();
  }

  protected verProximas(): void {
    this.fecha.set('');
    void this.load();
  }

  protected formatearDia(dia: Date): string {
    return formatearDia(dia, this.i18n.locale());
  }

  protected formatearCreada(valor: string): string {
    return formatearFechaHora(valor, this.i18n.locale());
  }

  protected hora(entrada: EntradaListaEsperaPanel): string {
    return entrada.horario.slice(0, 5);
  }

  protected isToday(fecha: string): boolean {
    return fecha === this.today;
  }
}
