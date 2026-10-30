import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { CartaPublicaDTO } from '../models/restaurante.models';
import { RestauranteService } from './restaurante.service';

describe('RestauranteService', () => {
  let service: RestauranteService;
  let http: HttpTestingController;

  const carta: CartaPublicaDTO = {
    id: 3,
    nombreArchivo: 'carta.pdf',
    url: '/api/files/cartas/5/a.pdf',
    tamanioBytes: 2048,
    actualizadaEn: '2026-10-20T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RestauranteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('debería devolver la carta pública del restaurante', async () => {
    const respuesta = firstValueFrom(service.obtenerCarta(5));
    http.expectOne({ method: 'GET', url: '/api/restaurantes/5/carta' }).flush(carta);

    expect(await respuesta).toEqual(carta);
  });

  it('debería devolver null si el restaurante no subió carta, sin marcar error', async () => {
    const respuesta = firstValueFrom(service.obtenerCarta(5));
    http
      .expectOne('/api/restaurantes/5/carta')
      .flush({ mensaje: 'Carta no encontrada' }, { status: 404, statusText: 'Not Found' });

    expect(await respuesta).toBeNull();
    expect(service.error()).toBeNull();
  });

  it('debería devolver null si falla el pedido de la carta', async () => {
    const respuesta = firstValueFrom(service.obtenerCarta(5));
    http
      .expectOne('/api/restaurantes/5/carta')
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(await respuesta).toBeNull();
    expect(service.error()).toBeNull();
  });
});
