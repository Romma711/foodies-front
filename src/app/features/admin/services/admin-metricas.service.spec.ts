import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AUTH_ROLE } from '../../../core/auth/auth-context';
import { MetricasAdmin } from '../models/metricas-admin';
import { AdminMetricasService } from './admin-metricas.service';

describe('AdminMetricasService', () => {
  let service: AdminMetricasService;
  let httpMock: HttpTestingController;

  const metricas: MetricasAdmin = {
    periodo: '2026-10',
    topRestaurantesMejorCalificados: [
      { id: 5, nombre: 'Ochiwan', promedio: 4.5, cantidadResenas: 2 },
    ],
    topRestaurantesConMasReservas: [{ id: 5, nombre: 'Ochiwan', cantidadReservas: 7 }],
    topUsuariosConMasResenas: [{ id: 3, nombre: 'Ana', apellido: 'Gómez', cantidadResenas: 4 }],
    usuariosRegistradosEsteMes: 12,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminMetricasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debería pedir las métricas con el token de admin y guardarlas', () => {
    service.cargar().subscribe();
    expect(service.cargando()).toBe(true);

    const req = httpMock.expectOne('/api/admin/metricas');
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(AUTH_ROLE)).toBe('ADMIN');
    req.flush(metricas);

    expect(service.metricas()).toEqual(metricas);
    expect(service.cargando()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('debería explicar un 403 sin perder las métricas anteriores', () => {
    service.cargar().subscribe();
    httpMock.expectOne('/api/admin/metricas').flush(metricas);

    service.cargar().subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/admin/metricas')
      .flush({ error: 'No tenés permisos' }, { status: 403, statusText: 'Forbidden' });

    expect(service.error()).toBe('Tu sesión no tiene permisos de administrador.');
    expect(service.metricas()).toEqual(metricas);
    expect(service.cargando()).toBe(false);
  });

  it('debería avisar cuando el servidor no responde', () => {
    service.cargar().subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/admin/metricas')
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(service.error()).toBe('No se pudo conectar con el servidor.');
  });
});
