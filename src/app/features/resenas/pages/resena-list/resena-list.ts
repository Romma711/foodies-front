import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { RatingDistribution } from '../../components/rating-distribution/rating-distribution';
import { ResenaCard } from '../../components/resena-card/resena-card';
import { ResenaForm } from '../../components/resena-form/resena-form';
import { StarRating } from '../../components/star-rating/star-rating';
import { ResenaDetailDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';

@Component({
  selector: 'app-resena-list',
  imports: [RatingDistribution, ResenaCard, ResenaForm, StarRating, RouterLink],
  templateUrl: './resena-list.html',
})
export class ResenaList {
  private readonly resenaService = inject(ResenaService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly restauranteId = input.required<string>();

  readonly id = computed(() => Number(this.restauranteId()));
  readonly idValido = computed(() => Number.isInteger(this.id()) && this.id() > 0);
  readonly resenas = this.resenaService.resenas;
  readonly cargando = this.resenaService.loading;
  readonly error = this.resenaService.error;
  readonly total = this.resenaService.totalResenas;
  readonly promedio = this.resenaService.promedioCalificacion;
  readonly distribucion = this.resenaService.distribucionCalificaciones;
  readonly esCliente = computed(() => this.auth.isAuthenticated('CLIENTE'));
  readonly misResenaIds = this.resenaService.misResenaIds;
  readonly yaReseno = computed(() =>
    this.resenas().some((resena) => this.misResenaIds().has(resena.id)),
  );

  readonly mostrarFormulario = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.id();
      if (this.idValido()) {
        this.cargar(id);
      }
    });

    effect(() => {
      const usuarioId = this.esCliente() ? this.auth.userId('CLIENTE') : null;
      if (usuarioId !== null) {
        this.resenaService
          .cargarMisResenas(usuarioId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      }
    });
  }

  recargar(): void {
    if (this.idValido()) {
      this.cargar(this.id());
    }
  }

  abrirFormulario(): void {
    if (!this.idValido()) {
      return;
    }
    this.mensajeExito.set(null);
    this.editandoId.set(null);
    this.mostrarFormulario.set(true);
  }

  editar(id: number): void {
    this.mensajeExito.set(null);
    this.mostrarFormulario.set(false);
    this.editandoId.set(id);
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  alActualizar(): void {
    this.editandoId.set(null);
    this.mensajeExito.set('Tu reseña se actualizó.');
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  alCrear(resena: ResenaDetailDTO): void {
    this.mostrarFormulario.set(false);
    const nombre = resena.nombreUsuario?.trim();
    this.mensajeExito.set(
      nombre
        ? `¡Gracias, ${nombre}! Tu reseña ya está publicada.`
        : '¡Gracias! Tu reseña ya está publicada.',
    );
  }

  cerrarExito(): void {
    this.mensajeExito.set(null);
  }

  private cargar(id: number): void {
    this.resenaService
      .listarPorRestaurante(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
