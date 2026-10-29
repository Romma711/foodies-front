import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Estructura del panel del restaurante: navegación entre secciones + la sección activa. */
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-panel-layout',
  styleUrl: './panel-layout.css',
  templateUrl: './panel-layout.html',
})
export class PanelLayout {
  protected readonly sections = [
    { path: '.', label: 'Resumen', exact: true },
    { path: 'perfil', label: 'Perfil', exact: false },
    { path: 'carta', label: 'Carta', exact: false },
    { path: 'reservas', label: 'Reservas', exact: false },
    { path: 'capacidad', label: 'Capacidad', exact: false },
  ];
}
