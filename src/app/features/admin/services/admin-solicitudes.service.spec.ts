import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SolicitudRestaurante } from '../models/solicitud-restaurante';
import { AdminSolicitudesService } from './admin-solicitudes.service';

const API = environment.apiUrl;

export function solicitud(overrides: Partial<SolicitudRestaurante> = {}): SolicitudRestaurante {
  return {
    restaurantId: 12,
    nombre: 'La Parrilla',
    ubicacion: 'Av. Colón 1200',
    especialidad: 'PARRILLA',
    cupoMaximo: 40,
    estado: 'PENDIENTE',
    usuarioId: 112,
    email: 'encargado@laparrilla.com',
    telefono: '2235550000',
    fechaRegistro: '2026-10-28T10:15:00',
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

  async function cargarCon(solicitudes: SolicitudRestaurante[]) {
    const carga = firstValueFrom(service.cargar());
    http.expectOne(`${API}/admin/restaurantes/pendientes`).flush(solicitudes);
    await carga;
  }

  it('carga las solicitudes pendientes y maneja el estado de carga', async () => {
    const carga = firstValueFrom(service.cargar());
    expect(service.cargando()).toBe(true);

    http
      .expectOne(`${API}/admin/restaurantes/pendientes`)
      .flush([solicitud({ restaurantId: 1, nombre: 'Pasta Nostra' })]);
    await carga;

    expect(service.cargando()).toBe(false);
    expect(service.solicitudes().map((s) => s.nombre)).toEqual(['Pasta Nostra']);
  });

  it('aprueba con PUT y saca la solicitud de la lista', async () => {
    await cargarCon([
      solicitud({ restaurantId: 1, nombre: 'Pasta Nostra' }),
      solicitud({ restaurantId: 2, nombre: 'El Muelle' }),
    ]);

    const aprobar = firstValueFrom(service.aprobar(1));
    const req = http.expectOne(`${API}/admin/restaurantes/1/aprobar`);
    expect(req.request.method).toBe('PUT');
    req.flush({ restaurantId: 1, nombre: 'Pasta Nostra', estado: 'APROBADO' });
    await aprobar;

    expect(service.solicitudes().map((s) => s.restaurantId)).toEqual([2]);
  });

  it('rechaza con PUT y saca la solicitud de la lista', async () => {
    await cargarCon([solicitud({ restaurantId: 1, nombre: 'Pasta Nostra' })]);

    const rechazar = firstValueFrom(service.rechazar(1));
    const req = http.expectOne(`${API}/admin/restaurantes/1/rechazar`);
    expect(req.request.method).toBe('PUT');
    req.flush({ restaurantId: 1, nombre: 'Pasta Nostra', estado: 'RECHAZADO' });
    await rechazar;

    expect(service.solicitudes()).toEqual([]);
  });

  it('si falla una acción deja la solicitud y devuelve un mensaje para mostrar', async () => {
    await cargarCon([solicitud({ restaurantId: 1, nombre: 'Pasta Nostra' })]);

    const rechazar = firstValueFrom(service.rechazar(1));
    http.expectOne(`${API}/admin/restaurantes/1/rechazar`).flush(
      { mensaje: 'Solo se pueden rechazar solicitudes pendientes' },
      {
        status: 400,
        statusText: 'Bad Request',
      },
    );

    await expect(rechazar).rejects.toThrow('Solo se pueden rechazar solicitudes pendientes');
    expect(service.solicitudes()).toHaveLength(1);
  });

  it('expone un mensaje legible cuando no puede cargar', async () => {
    const carga = firstValueFrom(service.cargar());
    http.expectOne(`${API}/admin/restaurantes/pendientes`).flush(null, {
      status: 403,
      statusText: 'Forbidden',
    });

    await expect(carga).rejects.toBeTruthy();
    expect(service.error()).toBe('Tu sesión no tiene permisos de administrador.');
  });
});
