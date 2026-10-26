import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Role, ROLES } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { PORTALS } from '../../core/auth/portals';

const ROLE_LABELS: Record<Role, string> = {
  CLIENTE: 'Cliente',
  RESTAURANTE: 'Restaurante',
  ADMIN: 'Admin',
};

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly portals = PORTALS;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly menuAbierto = signal(false);

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

  protected async logout(role: Role): Promise<void> {
    this.cerrarMenu();
    this.auth.logout(role);
    await this.router.navigateByUrl(PORTALS[role].loginPath);
  }
}
