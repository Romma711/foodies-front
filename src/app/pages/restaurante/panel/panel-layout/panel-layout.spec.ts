import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { violacionesAxe } from '../../../../shared/testing/axe';
import { miRestaurante, providePanelTesting } from '../panel.testing';
import { PanelLayout } from './panel-layout';

describe('PanelLayout', () => {
  let fixture: ComponentFixture<PanelLayout>;
  let element: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: providePanelTesting() });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PanelLayout);
    element = fixture.nativeElement as HTMLElement;
    http.expectOne({ method: 'GET', url: '/api/restaurantes/me' }).flush(miRestaurante());
    await fixture.whenStable();
    // jsdom no aplica la media query de desktop: se despliega la barra como en mobile.
    element.querySelector<HTMLButtonElement>('[aria-controls="panel-sidebar"]')!.click();
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  const cuentaBoton = () =>
    element.querySelector<HTMLButtonElement>('[aria-controls="cuenta-menu"]')!;

  it('lists every panel section in the sidebar', () => {
    const labels = Array.from(
      element.querySelectorAll('nav[aria-label="Panel del restaurante"] a'),
      (a) => a.textContent?.trim(),
    );

    expect(labels).toEqual([
      'Resumen',
      'Perfil',
      'Carta',
      'Fotos',
      'Reservas',
      'Espacios',
      'Horarios',
      'Capacidad',
    ]);
  });

  it('shows the restaurant name at the bottom of the sidebar', () => {
    expect(element.querySelector('aside app-cuenta-menu')).not.toBeNull();
    expect(cuentaBoton().textContent).toContain('La Parrilla');
  });

  it('passes axe with the sidebar open', async () => {
    expect(await violacionesAxe(element)).toEqual([]);
  });

  it('logs out of the restaurant session and goes to its login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    cuentaBoton().click();
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('#cuenta-menu button')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(AuthService).isAuthenticated('RESTAURANTE')).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/restaurante/login');
  });
});
