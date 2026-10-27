import { HttpEventType } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { providePanelTesting, RESTAURANTE_TOKEN } from './panel.testing';
import { RestaurantePanelService } from './restaurante-panel.service';

describe('RestaurantePanelService', () => {
  let service: RestaurantePanelService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: providePanelTesting() });
    service = TestBed.inject(RestaurantePanelService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends every call with the restaurant session token', () => {
    localStorage.setItem('foodies.token.CLIENTE', 'other-role-token');
    service.getMiRestaurante().subscribe();
    service.getReservas().subscribe();
    service.actualizar({ nombre: 'Nuevo' }).subscribe();
    service.eliminarCarta().subscribe();
    service.cambiarEstado(5, 'ACEPTADA').subscribe();

    const requests = [
      http.expectOne({ method: 'GET', url: '/api/restaurantes/me' }),
      http.expectOne({ method: 'GET', url: '/api/restaurantes/me/reservas' }),
      http.expectOne({ method: 'PATCH', url: '/api/restaurantes/me' }),
      http.expectOne({ method: 'DELETE', url: '/api/restaurantes/me/carta' }),
      http.expectOne({ method: 'PATCH', url: '/api/reservas/5/estado' }),
    ];
    for (const req of requests) {
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${RESTAURANTE_TOKEN}`);
      req.flush(null);
    }
    expect(requests[2].request.body).toEqual({ nombre: 'Nuevo' });
    expect(requests[4].request.body).toEqual({ estado: 'ACEPTADA' });
  });

  it('uploads the menu as multipart with progress events', () => {
    const file = new File(['%PDF-1.4'], 'menu.pdf', { type: 'application/pdf' });
    const types: HttpEventType[] = [];
    service.subirCarta(file).subscribe((event) => types.push(event.type));

    const req = http.expectOne({ method: 'PUT', url: '/api/restaurantes/me/carta' });
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('archivo')).toBeInstanceOf(File);
    expect(req.request.reportProgress).toBe(true);
    req.flush({ id: 1, nombreArchivo: 'menu.pdf', url: '/api/files/x.pdf' });

    expect(types).toContain(HttpEventType.Response);
  });
});
