import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Mensaje } from '@core/i18n/traducir';
import { AuthService } from '../../../core/auth/auth.service';
import { enfocarTrasRender } from '../../../shared/a11y/enfocar';
import { ReservaEditForm } from '../../components/reserva-edit-form/reserva-edit-form';
import { MiListaEspera } from '../../../lista-espera/components/mi-lista-espera/mi-lista-espera';
import { ESTADOS_ACTIVOS, EstadoReserva, ReservaListDTO } from '../../models';
import { ReservaService } from '../../services/reserva.service';
import { ResenaService } from '../../../resenas/services/resena.service';
import {
  estadoLabel,
  formatearFechaReserva,
  formatearHora,
  puedeCambiarReserva,
} from '../../utils/reserva-formato';
import { Clave } from '@core/i18n/traducir';

/** Text shown on a reservation that can no longer change. */
const MENSAJE_FINAL: Partial<Record<EstadoReserva, Clave>> = {
  CANCELADA: 'misReservas.cancelada',
  RECHAZADA: 'misReservas.rechazada',
  NO_ASISTIO: 'misReservas.noAsistio',
  VENCIDA: 'misReservas.vencida',
};
import { TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';

@Component({
  imports: [TPipe, RouterLink, ReservaEditForm, MiListaEspera],
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.html',
})
export class MisReservas {
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18n);
  private readonly reservaService = inject(ReservaService);
  private readonly resenaService = inject(ResenaService);
  /** Attended reservations link to the review only where the client has not reviewed yet. */
  protected readonly restaurantesResenados = this.resenaService.restaurantesResenados;
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly reservas = this.reservaService.reservas;
  protected readonly cargando = this.reservaService.loading;
  protected readonly error = this.reservaService.error;
  protected readonly saving = this.reservaService.saving;
  protected readonly mutationError = this.reservaService.mutationError;
  protected readonly cancelandoId = signal<number | null>(null);
  /** Reservation whose edit form is open; only one at a time. */
  protected readonly editandoId = signal<number | null>(null);
  /** Confirmation announced after a reservation change is saved. */
  protected readonly avisoModificacion = signal<Mensaje | null>(null);

  protected readonly pendientes = computed(
    () => this.reservas().filter((reserva) => reserva.estadoReserva === 'PENDIENTE').length,
  );
  protected readonly confirmadas = computed(
    () => this.reservas().filter((reserva) => reserva.estadoReserva === 'ACEPTADA').length,
  );

  protected readonly estadoLabel = estadoLabel;
  protected formatearFecha(valor: string): string {
    return formatearFechaReserva(valor, this.i18n.locale());
  }
  protected readonly formatearHora = formatearHora;

  constructor() {
    this.cargar();
  }

  protected recargar(): void {
    this.cargar();
  }

  protected iniciarCancelacion(id: number): void {
    this.reservaService.limpiarErrorMutacion();
    this.avisoModificacion.set(null);
    this.editandoId.set(null);
    this.cancelandoId.set(id);
  }

  protected iniciarEdicion(id: number): void {
    this.reservaService.limpiarErrorMutacion();
    this.avisoModificacion.set(null);
    this.cancelandoId.set(null);
    this.editandoId.set(id);
  }

  protected cerrarEdicion(): void {
    const id = this.editandoId();
    this.reservaService.limpiarErrorMutacion();
    this.editandoId.set(null);
    if (id !== null) {
      this.enfocarModificar(id);
    }
  }

  protected edicionGuardada(): void {
    const id = this.editandoId();
    this.cerrarEdicion();
    if (id !== null) {
      this.avisoModificacion.set({ clave: 'misReservas.guardamos', parametros: { id } });
    }
  }

  /** The edit form disappears on close, so focus returns to the button that opened it. */
  private enfocarModificar(id: number): void {
    enfocarTrasRender(this.host, `button[data-modificar="${id}"]`, this.injector);
  }

  protected cerrarCancelacion(): void {
    this.cancelandoId.set(null);
  }

  protected confirmarCancelacion(id: number): void {
    this.reservaService
      .cancelar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.cancelandoId.set(null),
        error: () => undefined,
      });
  }

  /** Modify and cancel are offered only while the server would accept them (rule D3). */
  protected puedeCambiar(reserva: ReservaListDTO): boolean {
    return puedeCambiarReserva(reserva);
  }

  protected esActiva(estado: EstadoReserva): boolean {
    return ESTADOS_ACTIVOS.includes(estado);
  }

  protected mensajeFinal(estado: EstadoReserva): Clave {
    return MENSAJE_FINAL[estado] ?? 'misReservas.cancelada';
  }

  protected estadoClases(estado: EstadoReserva): string {
    const base =
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset';
    switch (estado) {
      case 'PENDIENTE':
        return `${base} bg-amber-50 text-amber-800 ring-amber-200`;
      case 'ACEPTADA':
      case 'ASISTIO':
        return `${base} bg-emerald-50 text-emerald-800 ring-emerald-200`;
      case 'RECHAZADA':
      case 'NO_ASISTIO':
        return `${base} bg-red-50 text-red-800 ring-red-200`;
      case 'CANCELADA':
      case 'VENCIDA':
        return `${base} bg-cream-100 text-ink-600 ring-line`;
    }
  }

  private cargar(): void {
    const usuarioId = this.auth.userId('CLIENTE');
    if (usuarioId === null) {
      return;
    }
    this.reservaService
      .listarPorUsuario(usuarioId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
    this.resenaService
      .cargarMisResenas(usuarioId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
