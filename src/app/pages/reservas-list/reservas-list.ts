import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { ReservaForm } from '../../components/reserva-form/reserva-form';
import { ReservaDetail } from '../../models/reserva';
import { Auth } from '../../services/auth-service';
import { ReservaService } from '../../services/reserva-service';

@Component({
  selector: 'app-reservas-list',
  imports: [DatePipe, ReservaForm],
  styleUrl: './reservas-list.css',
  templateUrl: './reservas-list.html',
})
export class ReservasList {
  private readonly auth = inject(Auth);
  private readonly reservaService = inject(ReservaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cargando = this.reservaService.cargando;
  readonly mostrandoFormulario = signal(false);
  readonly cancelacionId = signal<number | null>(null);
  readonly aviso = signal<string | null>(null);
  private readonly sinIdentificar = signal(false);

  readonly error = computed(
    () =>
      this.reservaService.error() ??
      (this.sinIdentificar() ? 'No pudimos identificar tu cuenta de usuario.' : null),
  );

  /** Las próximas primero; las canceladas, al final. */
  readonly reservas = computed(() =>
    [...this.reservaService.reservas()].sort((a, b) => {
      if (a.estadoReserva === 'CANCELADA' && b.estadoReserva !== 'CANCELADA') {
        return 1;
      }
      if (b.estadoReserva === 'CANCELADA' && a.estadoReserva !== 'CANCELADA') {
        return -1;
      }
      return this.enMillis(a) - this.enMillis(b);
    }),
  );

  constructor() {
    this.cargar();
  }

  recargar(): void {
    this.cancelacionId.set(null);
    this.cargar();
  }

  alternarFormulario(): void {
    this.aviso.set(null);
    this.mostrandoFormulario.update((visible) => !visible);
  }

  cancelar(id: number): void {
    this.reservaService
      .cancelar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.cancelacionId.set(null),
        error: () => this.cancelacionId.set(null),
      });
  }

  alCrear(): void {
    this.mostrandoFormulario.set(false);
    this.aviso.set('¡Reserva creada! Ya está en tu lista, pendiente de confirmación.');
  }

  hora(reserva: ReservaDetail): string {
    return reserva.horariollegada?.slice(0, 5) ?? '';
  }

  private cargar(): void {
    this.auth
      .asegurarUsuarioId()
      .pipe(
        switchMap((id) => this.reservaService.listarPorUsuario(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => this.sinIdentificar.set(this.reservaService.error() === null),
      });
  }

  private enMillis(reserva: ReservaDetail): number {
    const fecha = reserva.fecha;
    if (typeof fecha === 'number') {
      return fecha;
    }
    const millis = Date.parse(fecha);
    return Number.isNaN(millis) ? 0 : millis;
  }
}
