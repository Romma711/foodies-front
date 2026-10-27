import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Role, ROLES } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { PORTALS } from '../../core/auth/portals';

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly portals = PORTALS;
  /** Each role keeps its own session, so several can be active at once. */
  protected readonly activeRoles = computed(() =>
    ROLES.filter((role) => this.auth.isAuthenticated(role)),
  );

  protected async logout(role: Role): Promise<void> {
    this.auth.logout(role);
    await this.router.navigateByUrl(PORTALS[role].loginPath);
  }
}
