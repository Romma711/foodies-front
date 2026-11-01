import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AUTH_ROLE } from '../../../core/auth/auth-context';
import { SolicitudRestaurante } from '../models/solicitud-restaurante';
import { AdminSolicitudesService } from './admin-solicitudes.service';

export function solicitud(overrides: Partial<SolicitudRestaurante> = {}): SolicitudRestaurante {
  return {
    id: 12,
    nombre: 'La Parrilla',
    email: 'encargado@laparrilla.com',
    telefono: '2235550000',
    rol: 'ROLE_PENDIENTE',
    fotos: [
      { id: 1, url: '/api/files/fotos/3/a.jpg', portada: false },
      { id: 2, url: '/api/files/fotos/3/b.jpg', portada: true },
    ],
    ...overrides,
  };
}

describe('AdminSolicitudesService', () => {
  let service: AdminSolicitudesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminSolicitudesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the pending restaurants with the admin session', () => {
    service.cargar().subscribe();

    const req = http.expectOne({ method: 'GET', url: '/api/admin/requests' });
    expect(req.request.context.get(AUTH_ROLE)).toBe('ADMIN');
    req.flush([solicitud()]);

    expect(service.solicitudes()).toEqual([solicitud()]);
    expect(service.cargando()).toBe(false);
  });

  it('treats the 204 of an empty queue as an empty list', () => {
    service.cargar().subscribe();

    http.expectOne('/api/admin/requests').flush(null, { status: 204, statusText: 'No Content' });

    expect(service.solicitudes()).toEqual([]);
    expect(service.error()).toBeNull();
  });

  it('reports a readable error when the list fails', () => {
    service.cargar().subscribe({ error: () => undefined });

    http.expectOne('/api/admin/requests').flush(null, { status: 403, statusText: 'Forbidden' });

    expect(service.error()).toBe('Tu sesión no tiene permisos de administrador.');
  });

  it('approves by user id and drops the restaurant from the queue', async () => {
    service.cargar().subscribe();
    http.expectOne('/api/admin/requests').flush([solicitud(), solicitud({ id: 13 })]);

    const aprobado = firstValueFrom(service.aprobar(12));
    const req = http.expectOne({ method: 'PUT', url: '/api/admin/approved/12' });
    expect(req.request.context.get(AUTH_ROLE)).toBe('ADMIN');
    req.flush({ id: 12, rol: 'ROLE_ENCARGADO' });
    await aprobado;

    expect(service.solicitudes().map((s) => s.id)).toEqual([13]);
  });

  it('turns a failed approval into a readable Error', async () => {
    const aprobado = firstValueFrom(service.aprobar(12));
    http
      .expectOne('/api/admin/approved/12')
      .flush(null, { status: 0, statusText: 'Unknown Error' });

    await expect(aprobado).rejects.toThrow('No se pudo conectar con el servidor.');
  });
});
