import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CalificacionService } from './calificacion.service';

describe('CalificacionService', () => {
  let service: CalificacionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CalificacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function resena(calificacion: number) {
    return { id: calificacion, nombreUsuario: 'Ana', comentario: 'Muy rico todo', calificacion };
  }

  it('promedia las reseñas del restaurante con un decimal', async () => {
    const promedio = firstValueFrom(service.promedio(7));

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/resenas`);
    expect(req.request.params.get('id')).toBe('7');
    req.flush([resena(5), resena(4), resena(4)]);

    expect(await promedio).toEqual({ promedio: 4.3, total: 3 });
  });

  it('devuelve 0 reseñas cuando el backend responde sin contenido', async () => {
    const promedio = firstValueFrom(service.promedio(8));

    http.expectOne((r) => r.url === `${environment.apiUrl}/resenas`).flush(null);

    expect(await promedio).toEqual({ promedio: 0, total: 0 });
  });

  it('no vuelve a pedir el promedio de un restaurante ya consultado', async () => {
    const primero = firstValueFrom(service.promedio(9));
    http.expectOne((r) => r.url === `${environment.apiUrl}/resenas`).flush([resena(3)]);
    await primero;

    expect(await firstValueFrom(service.promedio(9))).toEqual({ promedio: 3, total: 1 });
    http.expectNone((r) => r.url === `${environment.apiUrl}/resenas`);
  });
});
