import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { violacionesAxe } from '../../../shared/testing/axe';
import { solicitud } from '../../testing/solicitud';
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

  async function render(restaurantId: number, pendientes = [solicitud()]): Promise<void> {
    fixture = TestBed.createComponent(DetalleSolicitud);
    fixture.componentRef.setInput('restaurantId', restaurantId);
    element = fixture.nativeElement as HTMLElement;
    http.expectOne('/api/admin/restaurantes/pendientes').flush(pendientes);
    await fixture.whenStable();
  }

  const boton = (texto: string) =>
    Array.from(element.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto);
  const aceptar = () => boton('Aceptar');

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

    http
      .expectOne({ method: 'PUT', url: '/api/admin/restaurantes/12/aprobar' })
      .flush({ restaurantId: 12, nombre: 'La Parrilla', estado: 'APROBADO' });
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
    http
      .expectOne('/api/admin/restaurantes/12/aprobar')
      .flush(null, { status: 403, statusText: 'Forbidden' });
    // The rejection reaches the component a few microtasks after the flush.
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Tu sesión no tiene permisos de administrador.',
    );
    expect(aceptar()).toBeDefined();
  });

  it('shows the data the admin reviews before deciding', async () => {
    await render(12);

    expect(element.textContent).toContain('Parrilla');
    expect(element.textContent).toContain('Av. Colón 1200');
    expect(element.textContent).toContain('40 personas');
  });

  it('asks for confirmation before rejecting and lets the admin back out', async () => {
    await render(12);

    boton('Rechazar')!.click();
    await fixture.whenStable();
    expect(element.textContent).toContain('¿Rechazar la solicitud?');
    expect(document.activeElement).toBe(boton('Cancelar'));
    expect(await violacionesAxe(element)).toEqual([]);

    boton('Cancelar')!.click();
    await fixture.whenStable();
    expect(boton('Confirmar rechazo')).toBeUndefined();
    expect(document.activeElement).toBe(boton('Rechazar'));
  });

  it('rejects the restaurant and confirms it', async () => {
    await render(12);
    boton('Rechazar')!.click();
    await fixture.whenStable();

    boton('Confirmar rechazo')!.click();
    await fixture.whenStable();
    expect(boton('Rechazando…')?.disabled).toBe(true);
    expect(boton('Cancelar')?.disabled).toBe(true);

    http
      .expectOne({ method: 'PUT', url: '/api/admin/restaurantes/12/rechazar' })
      .flush({ restaurantId: 12, nombre: 'La Parrilla', estado: 'RECHAZADO' });
    await fixture.whenStable();

    const confirmacion = element.querySelector('[role="status"]');
    expect(confirmacion?.textContent).toContain('Se rechazó la solicitud de La Parrilla');
    expect(document.activeElement).toBe(confirmacion?.querySelector('h1'));
    expect(await violacionesAxe(element)).toEqual([]);
  });

  it('shows the backend message when rejecting fails and keeps the request', async () => {
    await render(12);
    boton('Rechazar')!.click();
    await fixture.whenStable();

    boton('Confirmar rechazo')!.click();
    await fixture.whenStable();
    http
      .expectOne('/api/admin/restaurantes/12/rechazar')
      .flush(
        { mensaje: 'Solo se pueden rechazar solicitudes pendientes' },
        { status: 400, statusText: 'Bad Request' },
      );
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Solo se pueden rechazar solicitudes pendientes',
    );
    expect(boton('Confirmar rechazo')?.disabled).toBe(false);
  });

  it('says so when the restaurant is no longer pending', async () => {
    await render(99);

    expect(element.textContent).toContain('Esta solicitud ya no está pendiente');
    expect(aceptar()).toBeUndefined();
  });
});
