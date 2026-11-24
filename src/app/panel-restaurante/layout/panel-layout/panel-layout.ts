import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { PORTALS } from '../../../core/auth/portals';
import { SelectorIdioma } from '../../../core/i18n/selector-idioma/selector-idioma';
import { CuentaMenu } from '../../../shared/ui/cuenta-menu/cuenta-menu';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import { TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';

/** Estructura del panel del restaurante: barra lateral con las secciones + la sección activa. */
@Component({
  imports: [TPipe, CuentaMenu, RouterLink, RouterLinkActive, RouterOutlet, SelectorIdioma],
  selector: 'app-panel-layout',
  styleUrl: './panel-layout.css',
  templateUrl: './panel-layout.html',
})
export class PanelLayout {
  private readonly auth = inject(AuthService);
  private readonly panel = inject(RestaurantePanelService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);

  protected readonly sections = [
    {
      path: '.',
      label: 'panel.seccion.resumen' as const,
      exact: true,
      icono: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
    },
    {
      path: 'perfil',
      label: 'panel.seccion.perfil' as const,
      exact: false,
      icono: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6',
    },
    {
      path: 'carta',
      label: 'panel.seccion.carta' as const,
      exact: false,
      icono: 'M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6m-6 4h6',
    },
    {
      path: 'fotos',
      label: 'panel.seccion.fotos' as const,
      exact: false,
      icono: 'M4 6h16v13H4V6Zm0 10 5-5 4 4 2-2 5 5M15.5 9.5h.01',
    },
    {
      path: 'reservas',
      label: 'panel.seccion.reservas' as const,
      exact: false,
      icono: 'M5 5h14v15H5V5Zm0 5h14M9 3v4m6-4v4',
    },
    {
      path: 'espacios',
      label: 'panel.seccion.espacios' as const,
      exact: false,
      icono: 'M3 21V9l9-6 9 6v12M3 21h18M9 21v-5h6v5M7 12h2m6 0h2',
    },
    {
      path: 'horarios',
      label: 'panel.seccion.horarios' as const,
      exact: false,
      icono: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2',
    },
    {
      path: 'turnos',
      label: 'panel.seccion.turnos' as const,
      exact: false,
      icono: 'M5 5h14v15H5V5Zm0 5h14M9 3v4m6-4v4M9 14h2m2 0h2m-6 3h2',
    },
    {
      path: 'capacidad',
      label: 'panel.seccion.capacidad' as const,
      exact: false,
      icono:
        'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 9a5 5 0 0 1 10 0m3-9a3 3 0 1 0 0-6m2 15h3a5 5 0 0 0-4-4.9',
    },
  ];

  /** Solo se usa en pantallas chicas, donde la barra lateral se pliega. */
  protected readonly menuAbierto = signal(false);

  protected readonly nombre = computed(
    () => this.panel.nombre() ?? this.i18n.t('panel.miRestaurante'),
  );

  constructor() {
    if (this.panel.nombre() === null) {
      // Si falla, la barra muestra el texto genérico; cada sección informa sus propios errores.
      this.panel.getMiRestaurante().subscribe({ error: () => undefined });
    }
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected async cerrarSesion(): Promise<void> {
    this.auth.logout('RESTAURANTE');
    await this.router.navigateByUrl(PORTALS.RESTAURANTE.loginPath);
  }
}
