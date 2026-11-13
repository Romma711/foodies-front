import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './core/layout/footer/footer';
import { Header } from './core/layout/header/header';
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

  private readonly contenido = viewChild.required<ElementRef<HTMLElement>>('contenido');

  /** Moves focus to the page content without letting the router handle the fragment. */
  protected saltarAlContenido(event: Event): void {
    event.preventDefault();
    this.contenido().nativeElement.focus();
  }
}
