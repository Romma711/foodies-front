import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SolicitudRestaurante } from '../../models/solicitud-restaurante';
import { solicitud } from '../../testing/solicitud';
import { SolicitudesRestaurantes } from './solicitudes-restaurantes';

describe('SolicitudesRestaurantes', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(
    respuesta: SolicitudRestaurante[] | null,
    status = 200,
  ): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(SolicitudesRestaurantes);
    http
      .expectOne('/api/admin/restaurantes/pendientes')
      .flush(respuesta, { status, statusText: 'x' });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists each pending restaurant with a link to its detail', async () => {
    const element = await render([solicitud(), solicitud({ restaurantId: 13, nombre: 'Ochiwan' })]);

    const links = Array.from(element.querySelectorAll('a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/admin/aceptar/12',
      '/admin/aceptar/13',
    ]);
    expect(links[1].getAttribute('aria-label')).toBe('Ver detalles de Ochiwan');
    expect(element.textContent).toContain('encargado@laparrilla.com');
    expect(element.querySelector('img')?.getAttribute('src')).toBe('/api/files/fotos/3/b.jpg');
  });

  it('has no accept button: approving happens on the detail page', async () => {
    const element = await render([solicitud()]);

    const textos = Array.from(element.querySelectorAll('button'), (b) => b.textContent?.trim());
    expect(textos).not.toContain('Aceptar');
  });

  it('shows the empty state when nothing is pending', async () => {
    const element = await render(null, 204);

    expect(element.textContent).toContain('No hay restaurantes por aceptar');
  });
});
