import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ResenaDetailDTO, ResenaListDTO, ResenaRequestDTO } from '../models';
import { ResenaService } from './resena.service';

describe('ResenaService', () => {
  let service: ResenaService;
  let httpMock: HttpTestingController;

  const apiUrl = '/api/resenas';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ResenaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debería listar las reseñas de un restaurante y actualizar las signals', () => {
    const mock: ResenaListDTO[] = [
      { id: 1, nombreUsuario: 'Ana', comentario: 'Excelente', calificacion: 5 },
      { id: 2, nombreUsuario: 'Luis', comentario: 'Muy bueno', calificacion: 4 },
    ];
    let resultado: ResenaListDTO[] = [];

    service.listarPorRestaurante(7).subscribe((resenas) => (resultado = resenas));

    const req = httpMock.expectOne(
      (request) => request.url === apiUrl && request.params.get('id') === '7',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mock);

    expect(resultado).toEqual(mock);
    expect(service.resenas()).toEqual(mock);
    expect(service.totalResenas()).toBe(2);
    expect(service.promedioCalificacion()).toBe(4.5);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('debería crear una reseña y reflejarla en el estado', () => {
    const payload: ResenaRequestDTO = {
      comentario: 'Muy rico',
      calificacion: 5,
      usuarioId: 3,
      restaurantId: 7,
    };
    const creada: ResenaDetailDTO = {
      id: 15,
      comentario: payload.comentario,
      calificacion: payload.calificacion,
      nombreUsuario: 'Ana',
      nombreRestaurant: 'La Trattoria',
    };
    let resultado: ResenaDetailDTO | undefined;

    service.crear(payload).subscribe((resena) => (resultado = resena));

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(creada, { status: 201, statusText: 'Created' });

    expect(resultado).toEqual(creada);
    expect(service.resena()).toEqual(creada);
    expect(service.resenas()).toEqual([
      { id: 15, nombreUsuario: 'Ana', comentario: 'Muy rico', calificacion: 5 },
    ]);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('debería devolver una lista vacía cuando el backend responde 204', () => {
    let resultado: ResenaListDTO[] | undefined;

    service.listarPorUsuario(3).subscribe((resenas) => (resultado = resenas));

    const req = httpMock.expectOne(`${apiUrl}/usuario/3`);
    expect(req.request.method).toBe('GET');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(resultado).toEqual([]);
    expect(service.resenas()).toEqual([]);
    expect(service.loading()).toBe(false);
  });

  it('debería exponer el mensaje de error enviado por el backend', () => {
    service.obtenerPorId(99).subscribe({ error: () => undefined });

    const req = httpMock.expectOne(`${apiUrl}/99`);
    req.flush(
      { error: 'error de negocio', mensaje: 'La reseña no existe.' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(service.error()).toBe('La reseña no existe.');
    expect(service.loading()).toBe(false);
  });
});
