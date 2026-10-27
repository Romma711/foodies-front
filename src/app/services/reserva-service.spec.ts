import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReservaService } from './reserva-service';

describe('ReservaService', () => {
  let service: ReservaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debería tratar la respuesta vacía (204) como una lista sin reservas', () => {
    let resultado: unknown;
    service.listarPorUsuario(1).subscribe((reservas) => (resultado = reservas));

    httpMock
      .expectOne('/api/reservas/usuario/1')
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(resultado).toEqual([]);
    expect(service.reservas()).toEqual([]);
    expect(service.error()).toBeNull();
  });

  it('debería enviar el estado CANCELADA al cancelar', () => {
    const detalle = {
      id: 7,
      cantidad: 2,
      fecha: 1761471600000,
      horariollegada: '20:30:00',
      estadoReserva: 'CANCELADA',
      nombreUsuario: 'Ada',
      nombreResto: 'La Parrilla',
    };
    let resultado: unknown;
    service.cancelar(7).subscribe((reserva) => (resultado = reserva));

    const requerimiento = httpMock.expectOne('/api/reservas/7');
    expect(requerimiento.request.method).toBe('PUT');
    expect(requerimiento.request.body).toEqual({ estadoReserva: 'CANCELADA' });
    requerimiento.flush(detalle);

    expect(resultado).toEqual(detalle);
  });
});
