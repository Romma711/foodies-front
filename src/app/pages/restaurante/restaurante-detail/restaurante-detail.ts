import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ESPECIALIDAD_LABELS } from '../../../core/catalog/especialidades';
import { ReservaForm } from '../../../features/reservas/components/reserva-form/reserva-form';
import { RestauranteResenas } from '../../../features/resenas/components/restaurante-resenas/restaurante-resenas';
import { ReservaDetailDTO } from '../../../features/reservas/models';
import {
  formatearFechaReserva,
  formatearHora,
} from '../../../features/reservas/utils/reserva-formato';
import { RestauranteService } from '../services/restaurante.service';

@Component({
  imports: [ReservaForm, RestauranteResenas, RouterLink],
  selector: 'app-restaurante-detail',
  templateUrl: './restaurante-detail.html',
})
export class RestauranteDetail {
  private readonly restauranteService = inject(RestauranteService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  readonly restauranteId = input.required<string>();

  protected readonly id = computed(() => Number(this.restauranteId()));
  protected readonly idValido = computed(() => Number.isInteger(this.id()) && this.id() > 0);
  protected readonly restaurante = this.restauranteService.restaurante;
  protected readonly cargando = this.restauranteService.loading;
  protected readonly error = this.restauranteService.error;
  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  protected readonly esCliente = computed(() => this.auth.isAuthenticated('CLIENTE'));
  protected readonly usuarioId = computed(() => this.auth.userId('CLIENTE'));
  protected readonly mostrarFormulario = signal(false);
  protected readonly reservaCreada = signal<ReservaDetailDTO | null>(null);

  protected readonly formatearFecha = formatearFechaReserva;
  protected readonly formatearHora = formatearHora;

  constructor() {
    effect(() => {
      const id = this.id();
      if (this.idValido()) {
        this.cargar(id);
      }
    });
  }

  protected recargar(): void {
    if (this.idValido()) {
      this.cargar(this.id());
    }
  }

  protected verResenas(): void {
    this.document.getElementById('resenas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected abrirFormulario(): void {
    this.mostrarFormulario.set(true);
  }

  protected cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  protected alCrear(reserva: ReservaDetailDTO): void {
    this.mostrarFormulario.set(false);
    this.reservaCreada.set(reserva);
  }

  protected nuevaReserva(): void {
    this.reservaCreada.set(null);
    this.mostrarFormulario.set(true);
  }

  private cargar(id: number): void {
    this.restauranteService.limpiar();
    this.reservaCreada.set(null);
    this.mostrarFormulario.set(false);
    this.restauranteService
      .obtener(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
