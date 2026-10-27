import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RestaurantService } from './restaurant-service';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RestaurantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debería listar los restaurantes aprobados', () => {
    const restaurantes = [
      { id: 5, nombre: 'La Parrilla', ubicacion: 'Av. Siempreviva 742', especialidad: 'PARRILLA' },
    ];
    let resultado: unknown;
    service.listar().subscribe((lista) => (resultado = lista));

    const requerimiento = httpMock.expectOne('/api/restaurantes');
    expect(requerimiento.request.method).toBe('GET');
    requerimiento.flush(restaurantes);

    expect(resultado).toEqual(restaurantes);
    expect(service.restaurantes()).toEqual(restaurantes);
  });

  it('debería cargar el detalle de un restaurante', () => {
    const detalle = {
      id: 5,
      nombre: 'La Parrilla',
      cupoMaximo: 40,
      ubicacion: 'Av. Siempreviva 742',
      especialidad: 'PARRILLA',
    };
    let resultado: unknown;
    service.obtenerPorId(5).subscribe((restaurante) => (resultado = restaurante));

    const requerimiento = httpMock.expectOne('/api/restaurantes/5');
    expect(requerimiento.request.method).toBe('GET');
    requerimiento.flush(detalle);

    expect(resultado).toEqual(detalle);
    expect(service.detalle()).toEqual(detalle);
  });
});
