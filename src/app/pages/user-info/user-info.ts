import { Component, DestroyRef, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { Auth } from '../../services/auth-service';
import { UserService } from '../../services/user-service';

@Component({
  selector: 'app-user-info',
  imports: [],
  styleUrl: './user-info.css',
  templateUrl: './user-info.html',
})
export class UserInfo {
  private readonly auth = inject(Auth);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly cliente = this.userService.cliente;
  readonly cargando = this.userService.cargando;
  readonly error = this.userService.error;

  readonly iniciales = computed(() => {
    const cliente = this.cliente();
    if (!cliente) {
      return '';
    }
    return `${cliente.nombre?.charAt(0) ?? ''}${cliente.apellido?.charAt(0) ?? ''}`.toUpperCase();
  });

  readonly rolVisible = computed(() => {
    const rol = this.cliente()?.rol;
    if (!rol) {
      return 'Cliente';
    }
    const limpio = rol.replace(/^ROLE_/, '').toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  });

  constructor() {
    this.cargar();
  }

  recargar(): void {
    this.cargar();
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  private cargar(): void {
    this.auth
      .asegurarUsuarioId()
      .pipe(
        switchMap((id) => this.userService.obtenerPorId(id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ error: () => undefined });
  }
}
