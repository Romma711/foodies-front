import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { enfocarTrasRender } from '../../../shared/a11y/enfocar';
import { ResenaDetailDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';
import { ReservaService } from '../../../reservas/services/reserva.service';
import { OPCIONES_ORDEN, OrdenResenas, filtrarYOrdenar } from '../../utils/ordenar-resenas';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { RatingDistribution } from '../rating-distribution/rating-distribution';
import { ResenaCard } from '../resena-card/resena-card';
import { ResenaForm } from '../resena-form/resena-form';
import { StarRating } from '../star-rating/star-rating';
import { ToastOutlet } from '../../../shared/ui/toast/toast-outlet';
import { TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';

/** Reviews block of a restaurant: summary, chart, write/edit/delete flows and the review grid. */
@Component({
  selector: 'app-restaurante-resenas',
  imports: [TPipe, RatingDistribution, ResenaCard, ResenaForm, StarRating, ToastOutlet, RouterLink],
  providers: [ToastService],
  templateUrl: './restaurante-resenas.html',
})
export class RestauranteResenas {
  private readonly resenaService = inject(ResenaService);
  private readonly reservaService = inject(ReservaService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  private readonly i18n = inject(I18n);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

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

  /**
   * Rule D12: only a client with an attended (ASISTIO) reservation at this restaurant can review
   * it. The server enforces it too (403).
   */
  readonly asistio = computed(() =>
    this.reservaService
      .reservas()
      .some((r) => r.idRestaurant === this.restauranteId() && r.estadoReserva === 'ASISTIO'),
  );
  readonly cargandoReservas = this.reservaService.loading;

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
        this.reservaService
          .listarPorUsuario(usuarioId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({ error: () => undefined });
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
    this.toasts.exito(this.i18n.t('resena.toast.actualizada'));
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
          this.toasts.exito(
            this.i18n.t(propia ? 'resena.toast.eliminadaPropia' : 'resena.toast.eliminada'),
          );
        },
        error: () => {
          this.eliminandoId.set(null);
          const error = this.resenaService.mutationError();
          this.toasts.error(
            error ? this.i18n.mensaje(error) : this.i18n.t('resena.toast.errorEliminar'),
          );
        },
      });
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    enfocarTrasRender(this.host, '[data-foco="escribir-resena"]', this.injector);
  }

  alCrear(resena: ResenaDetailDTO): void {
    this.mostrarFormulario.set(false);
    // The "write a review" box disappears once the client has reviewed, so focus goes to the title.
    enfocarTrasRender(this.host, '#titulo-resenas', this.injector);
    const nombre = resena.nombreUsuario?.trim();
    this.toasts.exito(
      nombre
        ? this.i18n.t('resena.toast.graciasNombre', { nombre })
        : this.i18n.t('resena.toast.gracias'),
    );
  }

  private cargar(id: number): void {
    this.resenaService
      .listarPorRestaurante(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
