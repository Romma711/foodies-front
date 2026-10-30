import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ESPECIALIDAD_LABELS } from '../../../../core/catalog/especialidades';
import { panelErrorMessage, toIsoDate } from '../panel-errors';
import { MiRestaurante, ReservaPanel } from '../panel.models';
import { RestaurantePanelService } from '../restaurante-panel.service';

@Component({
  imports: [RouterLink],
  selector: 'app-resumen',
  styleUrl: './resumen.css',
  templateUrl: './resumen.html',
})
export class Resumen implements OnInit {
  private readonly panel = inject(RestaurantePanelService);

  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly restaurante = signal<MiRestaurante | null>(null);
  private readonly reservas = signal<ReservaPanel[]>([]);
  private readonly today = toIsoDate(new Date());

  protected readonly pendientes = computed(
    () => this.reservas().filter((r) => r.estado === 'PENDIENTE' && r.fecha >= this.today).length,
  );
  protected readonly hoy = computed(() =>
    this.reservas().filter((r) => r.fecha === this.today && r.estado !== 'CANCELADA'),
  );
  protected readonly personasHoy = computed(() =>
    this.hoy().reduce((total, r) => total + r.cantidad, 0),
  );

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { restaurante, reservas } = await firstValueFrom(
        forkJoin({
          restaurante: this.panel.getMiRestaurante(),
          reservas: this.panel.getReservas(),
        }),
      );
      this.restaurante.set(restaurante);
      this.reservas.set(reservas);
    } catch (error) {
      this.error.set(panelErrorMessage(error, 'No pudimos cargar tu restaurante.'));
    } finally {
      this.loading.set(false);
    }
  }
}
