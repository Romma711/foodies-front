import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { TPipe } from '@core/i18n/t.pipe';

@Component({
  imports: [TPipe, RouterLink],
  selector: 'app-footer',
  templateUrl: './footer.html',
})
export class Footer {
  private readonly auth = inject(AuthService);

  /** With a client session the guest links make no sense; show the account shortcuts instead. */
  protected readonly clienteLogueado = computed(() => this.auth.isAuthenticated('CLIENTE'));

  protected readonly enlacesCliente = [
    { path: '/mis-reservas', label: 'nav.misReservas' as const },
    { path: '/mis-resenas', label: 'nav.misResenas' as const },
    { path: '/perfil', label: 'nav.miPerfil' as const },
  ];
}
