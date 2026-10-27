import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Shell of the restaurant manager panel: section navigation + the active section. */
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-panel-layout',
  styleUrl: './panel-layout.css',
  templateUrl: './panel-layout.html',
})
export class PanelLayout {
  protected readonly sections = [
    { path: '.', label: 'Overview', exact: true },
    { path: 'perfil', label: 'Profile', exact: false },
    { path: 'carta', label: 'Menu', exact: false },
    { path: 'reservas', label: 'Reservations', exact: false },
  ];
}
