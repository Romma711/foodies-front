import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';
import { PortalNavigation } from './core/auth/portal-navigation';

@Component({
  imports: [Header, Footer, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  /** El dashboard trae su propio shell (sidebar); el header/footer son de la app pública. */
  protected readonly portal = inject(PortalNavigation);
}
