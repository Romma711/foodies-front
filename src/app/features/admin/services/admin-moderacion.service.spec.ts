import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AUTH_ROLE } from '../../../core/auth/auth-context';
import { ResenaModeracion } from '../models/resena-moderacion';
import { AdminModeracionService } from './admin-moderacion.service';

describe('AdminModeracionService', () => {
  let service: AdminModeracionService;
  let httpMock: HttpTestingController;

  const resenas: ResenaModeracion[] = [
    {
      id: 9,
      comentario: 'Muy rico',
      calificacion: 5,
      nombreUsuario: 'Ana Gómez',
      restauranteId: 5,
      nombreRestaurante: 'Ochiwan',
    },
    {
      id: 8,
      comentario: 'Regular',
      calificacion: 2,
      nombreUsuario: '',
      restauranteId: 3,
      nombreRestaurante: 'La Casona',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminModeracionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function cargarListado() {
    service.cargar().subscribe();
    httpMock.expectOne((req) => req.url === '/api/admin/resenas').flush(resenas);
  }

  it('debería pedir las reseñas recientes con el token de admin', () => {
    service.cargar(20).subscribe();
    expect(service.cargando()).toBe(true);

    const req = httpMock.expectOne((request) => request.url === '/api/admin/resenas');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limite')).toBe('20');
    expect(req.request.context.get(AUTH_ROLE)).toBe('ADMIN');
    req.flush(resenas);

    expect(service.resenas()).toEqual(resenas);
    expect(service.cargando()).toBe(false);
  });

  it('debería eliminar con DELETE como admin y sacar la fila', () => {
    cargarListado();

    service.eliminar(9).subscribe();
    const req = httpMock.expectOne('/api/resenas/9');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.context.get(AUTH_ROLE)).toBe('ADMIN');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(service.resenas().map((resena) => resena.id)).toEqual([8]);
  });

  it('debería conservar la fila y explicar el error si el borrado falla', () => {
    cargarListado();
    let mensaje = '';

    service.eliminar(9).subscribe({ error: (error: Error) => (mensaje = error.message) });
    httpMock
      .expectOne('/api/resenas/9')
      .flush({ mensaje: 'Reseña no encontrada' }, { status: 404, statusText: 'Not Found' });

    expect(mensaje).toBe('La reseña ya no existe.');
    expect(service.resenas().length).toBe(2);
  });

  it('debería avisar si no se pudo cargar el listado', () => {
    service.cargar().subscribe({ error: () => undefined });
    httpMock
      .expectOne((req) => req.url === '/api/admin/resenas')
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(service.error()).toBe('Tu sesión no tiene permisos de administrador.');
  });
});
