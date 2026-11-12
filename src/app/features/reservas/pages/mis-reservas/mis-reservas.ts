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
import { AuthService } from '../../../../core/auth/auth.service';
import { enfocarTrasRender } from '../../../../shared/a11y/enfocar';
import { ReservaEditForm } from '../../components/reserva-edit-form/reserva-edit-form';
import { EstadoReserva } from '../../models';
import { ReservaService } from '../../services/reserva.service';
import { estadoLabel, formatearFechaReserva, formatearHora } from '../../utils/reserva-formato';

@Component({
  imports: [RouterLink, ReservaEditForm],
  selector: 'app-mis-reservas',
  templateUrl: './mis-reservas.html',
})
export class MisReservas {
  private readonly auth = inject(AuthService);
  private readonly reservaService = inject(ReservaService);
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
  protected readonly avisoModificacion = signal<string | null>(null);

  protected readonly pendientes = computed(
    () => this.reservas().filter((reserva) => reserva.estadoReserva === 'PENDIENTE').length,
  );
  protected readonly confirmadas = computed(
    () => this.reservas().filter((reserva) => reserva.estadoReserva === 'ACEPTADA').length,
  );

  protected readonly estadoLabel = estadoLabel;
  protected readonly formatearFecha = formatearFechaReserva;
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
      this.avisoModificacion.set(`Guardamos los cambios de la reserva #${id}.`);
    }
  }

  /** The edit form disappears on close, so focus returns to the button that opened it. */
  private enfocarModificar(id: number): void {
    enfocarTrasRender(this.host, `button[aria-label="Modificar la reserva #${id}"]`, this.injector);
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

  protected estadoClases(estado: EstadoReserva): string {
    const base =
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset';
    switch (estado) {
      case 'PENDIENTE':
        return `${base} bg-amber-50 text-amber-800 ring-amber-200`;
      case 'ACEPTADA':
        return `${base} bg-emerald-50 text-emerald-800 ring-emerald-200`;
      case 'CANCELADA':
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
  }
}
