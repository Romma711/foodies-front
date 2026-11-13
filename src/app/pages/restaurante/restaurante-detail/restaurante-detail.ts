import { DOCUMENT } from '@angular/common';
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
import { ESPECIALIDAD_LABELS } from '../../../core/catalog/especialidades';
import { ReservaForm } from '../../../features/reservas/components/reserva-form/reserva-form';
import { RestauranteResenas } from '../../../features/resenas/components/restaurante-resenas/restaurante-resenas';
import { ReservaDetailDTO } from '../../../features/reservas/models';
import {
  formatearFechaReserva,
  formatearHora,
} from '../../../features/reservas/utils/reserva-formato';
import { CartaPublicaDTO, FotoPublicaDTO } from '../models/restaurante.models';
import { RestauranteService } from '../services/restaurante.service';
import { HorariosService } from '../../../features/reservas/services/horarios.service';
import {
  DIA_SEMANA_LABELS,
  DIAS_SEMANA,
  FranjaHoraria,
  franjasDelDia,
  textoFranjas,
} from '../../../core/catalog/horarios';

@Component({
  imports: [ReservaForm, RestauranteResenas, RouterLink],
  selector: 'app-restaurante-detail',
  templateUrl: './restaurante-detail.html',
})
export class RestauranteDetail {
  private readonly restauranteService = inject(RestauranteService);
  private readonly horariosService = inject(HorariosService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

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
  protected readonly carta = signal<CartaPublicaDTO | null>(null);
  private readonly franjas = signal<FranjaHoraria[]>([]);
  /** Horario de atención por día, de lunes a domingo; vacío si el restaurante no lo cargó. */
  protected readonly horarioSemanal = computed(() =>
    this.franjas().length === 0
      ? []
      : DIAS_SEMANA.map((dia) => ({
          dia: DIA_SEMANA_LABELS[dia],
          texto: textoFranjas(franjasDelDia(this.franjas(), dia)),
        })),
  );
  protected readonly fotos = signal<FotoPublicaDTO[]>([]);
  protected readonly portada = computed(() => this.fotos().find((f) => f.portada) ?? null);
  protected readonly galeria = computed(() => this.fotos().filter((f) => !f.portada));

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
    enfocarTrasRender(this.host, '[data-foco="reservar"]', this.injector);
  }

  protected alCrear(reserva: ReservaDetailDTO): void {
    this.mostrarFormulario.set(false);
    this.reservaCreada.set(reserva);
    enfocarTrasRender(this.host, '[data-foco="reserva-enviada"]', this.injector);
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

    this.carta.set(null);
    this.restauranteService
      .obtenerCarta(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((carta) => this.carta.set(carta));

    this.franjas.set([]);
    this.horariosService
      .listar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (franjas) => this.franjas.set(franjas), error: () => undefined });

    this.fotos.set([]);
    this.restauranteService
      .obtenerFotos(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fotos) => this.fotos.set(fotos));
  }
}
