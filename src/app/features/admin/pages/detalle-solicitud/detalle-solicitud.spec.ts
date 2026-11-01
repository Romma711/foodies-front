import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { violacionesAxe } from '../../../../shared/testing/axe';
import { solicitud } from '../../services/admin-solicitudes.service.spec';
import { DetalleSolicitud } from './detalle-solicitud';

describe('DetalleSolicitud', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<DetalleSolicitud>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(usuarioId: number, pendientes = [solicitud()]): Promise<void> {
    fixture = TestBed.createComponent(DetalleSolicitud);
    fixture.componentRef.setInput('usuarioId', usuarioId);
    element = fixture.nativeElement as HTMLElement;
    http.expectOne('/api/admin/requests').flush(pendientes);
    await fixture.whenStable();
  }

  const aceptar = () =>
    Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Aceptar');

  it('shows the restaurant details, its photos and the accept button', async () => {
    await render(12);

    expect(element.querySelector('h1')?.textContent).toContain('La Parrilla');
    expect(element.textContent).toContain('encargado@laparrilla.com');
    expect(element.textContent).toContain('2235550000');
    expect(element.querySelectorAll('img')).toHaveLength(2);
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Foto 1 de La Parrilla');
    expect(aceptar()).toBeDefined();
    expect(await violacionesAxe(element)).toEqual([]);
  });

  it('approves the restaurant and confirms it', async () => {
    await render(12);

    aceptar()!.click();
    await fixture.whenStable();
    expect(aceptar()).toBeUndefined();
    expect(element.textContent).toContain('Aceptando…');

    http.expectOne({ method: 'PUT', url: '/api/admin/approved/12' }).flush({ id: 12 });
    await fixture.whenStable();

    const confirmacion = element.querySelector('[role="status"]');
    expect(confirmacion?.textContent).toContain('La Parrilla fue aceptado');
    expect(document.activeElement).toBe(confirmacion?.querySelector('h1'));
    expect(await violacionesAxe(element)).toEqual([]);
  });

  it('keeps the button and shows the error when approving fails', async () => {
    await render(12);

    aceptar()!.click();
    await fixture.whenStable();
    http.expectOne('/api/admin/approved/12').flush(null, { status: 403, statusText: 'Forbidden' });
    // The rejection reaches the component a few microtasks after the flush.
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Tu sesión no tiene permisos de administrador.',
    );
    expect(aceptar()).toBeDefined();
  });

  it('says so when the restaurant is no longer pending', async () => {
    await render(99);

    expect(element.textContent).toContain('Esta solicitud ya no está pendiente');
    expect(aceptar()).toBeUndefined();
  });
});
