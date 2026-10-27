import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ResenaDetailDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';
import { OPCIONES_ORDEN, OrdenResenas, filtrarYOrdenar } from '../../utils/ordenar-resenas';
import { ToastService } from '../../../../shared/toast/toast.service';
import { RatingDistribution } from '../rating-distribution/rating-distribution';
import { ResenaCard } from '../resena-card/resena-card';
import { ResenaForm } from '../resena-form/resena-form';
import { StarRating } from '../star-rating/star-rating';
import { ToastOutlet } from '../../../../shared/toast/toast-outlet';

/** Reviews block of a restaurant: summary, chart, write/edit/delete flows and the review grid. */
@Component({
  selector: 'app-restaurante-resenas',
  imports: [RatingDistribution, ResenaCard, ResenaForm, StarRating, ToastOutlet, RouterLink],
  providers: [ToastService],
  templateUrl: './restaurante-resenas.html',
})
export class RestauranteResenas {
  private readonly resenaService = inject(ResenaService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);

  readonly restauranteId = input.required<number>();
  readonly nombreRestaurante = input('');

  readonly idValido = computed(
    () => Number.isInteger(this.restauranteId()) && this.restauranteId() > 0,
  );
  readonly resenas = this.resenaService.resenas;
  readonly cargando = this.resenaService.loading;
  readonly error = this.resenaService.error;
  readonly total = this.resenaService.totalResenas;
  readonly promedio = this.resenaService.promedioCalificacion;
  readonly distribucion = this.resenaService.distribucionCalificaciones;
  readonly esCliente = computed(() => this.auth.isAuthenticated('CLIENTE'));
  readonly esAdmin = computed(() => this.auth.isAuthenticated('ADMIN'));
  readonly misResenaIds = this.resenaService.misResenaIds;
  readonly orden = signal<OrdenResenas>('recientes');
  /** Star count to show; null shows every review. */
  readonly filtroEstrellas = signal<number | null>(null);
  readonly visibles = computed(() =>
    filtrarYOrdenar(this.resenas(), this.orden(), this.filtroEstrellas()),
  );
  protected readonly opcionesOrden = OPCIONES_ORDEN;
  protected readonly chipActivo = 'bg-ink-900 text-white ring-ink-900';
  protected readonly chipInactivo = 'bg-white text-ink-700 ring-line hover:bg-cream-100';

  readonly yaReseno = computed(() =>
    this.resenas().some((resena) => this.misResenaIds().has(resena.id)),
  );

  protected readonly skeletons = [1, 2, 3];

  readonly mostrarFormulario = signal(false);
  readonly editandoId = signal<number | null>(null);
  readonly eliminandoId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const id = this.restauranteId();
      // Filters belong to the restaurant being viewed, so a new restaurant starts clean.
      this.filtroEstrellas.set(null);
      this.orden.set('recientes');
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

  filtrar(estrellas: number | null): void {
    this.filtroEstrellas.set(estrellas);
  }

  ordenar(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    const opcion = OPCIONES_ORDEN.find((item) => item.valor === valor);
    if (opcion) {
      this.orden.set(opcion.valor);
    }
  }

  recargar(): void {
    if (this.idValido()) {
      this.cargar(this.restauranteId());
    }
  }

  abrirFormulario(): void {
    if (!this.idValido()) {
      return;
    }
    this.editandoId.set(null);
    this.mostrarFormulario.set(true);
  }

  editar(id: number): void {
    this.mostrarFormulario.set(false);
    this.editandoId.set(id);
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  alActualizar(): void {
    this.editandoId.set(null);
    this.toasts.exito('Tu reseña se actualizó.');
  }

  esPropia(id: number): boolean {
    return this.esCliente() && this.misResenaIds().has(id);
  }

  /** Owners delete their own review; admins can moderate any of them. */
  puedeEliminar(id: number): boolean {
    return this.esPropia(id) || this.esAdmin();
  }

  eliminar(id: number): void {
    const propia = this.esPropia(id);
    this.eliminandoId.set(id);
    this.resenaService
      .eliminar(id, propia ? 'CLIENTE' : 'ADMIN')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.eliminandoId.set(null);
          this.toasts.exito(propia ? 'Tu reseña se eliminó.' : 'La reseña se eliminó.');
        },
        error: () => {
          this.eliminandoId.set(null);
          this.toasts.error(this.resenaService.mutationError() ?? 'No se pudo eliminar la reseña.');
        },
      });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
  }

  alCrear(resena: ResenaDetailDTO): void {
    this.mostrarFormulario.set(false);
    const nombre = resena.nombreUsuario?.trim();
    this.toasts.exito(
      nombre
        ? `¡Gracias, ${nombre}! Tu reseña ya está publicada.`
        : '¡Gracias! Tu reseña ya está publicada.',
    );
  }

  private cargar(id: number): void {
    this.resenaService
      .listarPorRestaurante(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
