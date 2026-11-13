import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ReservaDetailDTO, ReservaListDTO } from '../models';
import { ReservaService } from './reserva.service';

describe('ReservaService.modificar', () => {
  const aceptada: ReservaListDTO = {
    id: 7,
    cantidad: 4,
    fechaReserva: '2026-11-22',
    horariollegada: '21:30:00',
    estadoReserva: 'ACEPTADA',
    nombreResto: 'La Trattoria',
    idRestaurant: 5,
    idEspacio: 3,
    espacioNombre: 'Salón principal',
  };
  const otra: ReservaListDTO = { ...aceptada, id: 8, nombreResto: 'Ochiwan' };

  let service: ReservaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Loads the client's list so `modificar` has an item to update. */
  function cargarLista(): void {
    service.listarPorUsuario(29).subscribe();
    http.expectOne('/api/reservas/usuario/29').flush([aceptada, otra]);
  }

  it('envía el PUT con fecha, horario, cantidad y espacio, y actualiza la reserva en la lista', async () => {
    cargarLista();

    const resultado = firstValueFrom(
      service.modificar(7, {
        fechaReserva: '2026-11-25',
        horarioLlegada: '20:00',
        cantidad: 3,
        idEspacio: 4,
      }),
    );
    const req = http.expectOne('/api/reservas/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      fechaReserva: '2026-11-25',
      horarioLlegada: '20:00',
      cantidad: 3,
      idEspacio: 4,
    });
    const actualizada: ReservaDetailDTO = {
      id: 7,
      cantidad: 3,
      fecha: '2026-11-25',
      horariollegada: '20:00:00',
      estadoReserva: 'PENDIENTE',
      nombreUsuario: 'Ana',
      nombreResto: 'La Trattoria',
      idEspacio: 4,
      espacioNombre: 'Patio',
    };
    req.flush(actualizada);

    expect(await resultado).toEqual(actualizada);
    expect(service.reservas()).toEqual([
      {
        id: 7,
        cantidad: 3,
        fechaReserva: '2026-11-25',
        horariollegada: '20:00:00',
        estadoReserva: 'PENDIENTE',
        nombreResto: 'La Trattoria',
        idRestaurant: 5,
        idEspacio: 4,
        espacioNombre: 'Patio',
      },
      otra,
    ]);
    expect(service.saving()).toBe(false);
    expect(service.mutationError()).toBeNull();
  });

  it('expone el mensaje del servidor y no toca la lista cuando falla', async () => {
    cargarLista();

    const resultado = firstValueFrom(
      service.modificar(7, {
        fechaReserva: '2026-11-25',
        horarioLlegada: '20:00',
        cantidad: 50,
        idEspacio: 3,
      }),
    );
    http
      .expectOne('/api/reservas/7')
      .flush(
        { mensaje: 'No hay cupo disponible para esa fecha.' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expect(resultado).rejects.toBeTruthy();
    expect(service.mutationError()).toBe('No hay cupo disponible para esa fecha.');
    expect(service.reservas()).toEqual([aceptada, otra]);
  });
});
