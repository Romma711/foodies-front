import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Role, ROLES } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { PORTALS } from '../../core/auth/portals';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly portals = PORTALS;
  protected readonly menuAbierto = signal(false);

  /** Each role keeps its own session, so several can be active at once. */
  protected readonly activeRoles = computed(() =>
    ROLES.filter((role) => this.auth.isAuthenticated(role)),
  );

  protected readonly esCliente = computed(() => this.auth.isAuthenticated('CLIENTE'));

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected async logout(role: Role): Promise<void> {
    this.cerrarMenu();
    this.auth.logout(role);
    await this.router.navigateByUrl(PORTALS[role].loginPath);
  }
}
