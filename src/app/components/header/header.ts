import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Role, ROLES } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { PORTALS } from '../../core/auth/portals';
import { ClientePerfilService } from '../../features/perfil/services/cliente-perfil.service';
import { ClienteMenu } from './cliente-menu/cliente-menu';

@Component({
  imports: [ClienteMenu, RouterLink, RouterLinkActive],
  selector: 'app-header',
  templateUrl: './header.html',
  host: {
    '(document:keydown.escape)': 'cerrarMenuConEscape()',
  },
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly perfil = inject(ClientePerfilService);

  protected readonly portals = PORTALS;
  protected readonly menuAbierto = signal(false);
  private readonly toggleMenuMovil = viewChild<ElementRef<HTMLButtonElement>>('toggleMenuMovil');

  /** Accesos de la cuenta del cliente en el menú móvil (en desktop están en su popup). */
  protected readonly opcionesCliente = [
    { path: '/perfil', label: 'Mi perfil' },
    { path: '/mis-resenas', label: 'Mis reseñas' },
    { path: '/mis-reservas', label: 'Mis reservas' },
  ];

  /** Each role keeps its own session, so several can be active at once. */
  protected readonly activeRoles = computed(() =>
    ROLES.filter((role) => this.auth.isAuthenticated(role)),
  );

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  /** Escape closes the mobile menu and returns focus to its toggle button. */
  protected cerrarMenuConEscape(): void {
    if (!this.menuAbierto()) {
      return;
    }
    this.cerrarMenu();
    this.toggleMenuMovil()?.nativeElement.focus();
  }

  protected async logout(role: Role): Promise<void> {
    this.cerrarMenu();
    this.auth.logout(role);
    if (role === 'CLIENTE') {
      this.perfil.limpiar();
    }
    await this.router.navigateByUrl(PORTALS[role].loginPath);
  }
}
