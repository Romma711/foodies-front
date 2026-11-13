import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  imports: [RouterLink],
  selector: 'app-footer',
  templateUrl: './footer.html',
})
export class Footer {
  private readonly auth = inject(AuthService);

  /** With a client session the guest links make no sense; show the account shortcuts instead. */
  protected readonly clienteLogueado = computed(() => this.auth.isAuthenticated('CLIENTE'));

  protected readonly enlacesCliente = [
    { path: '/mis-reservas', label: 'Mis reservas' },
    { path: '/mis-resenas', label: 'Mis reseñas' },
    { path: '/perfil', label: 'Mi perfil' },
  ];
}
