import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EntidadCliente, EntidadRestaurante } from '../models/entidades-admin';
import { AdminEntidadesService } from './admin-entidades.service';

const API = environment.apiUrl;

const ANA: EntidadCliente = {
  id: 4,
  nombre: 'Ana',
  apellido: 'Gómez',
  email: 'ana@mail.com',
  telefono: '2231111111',
  strikes: 1,
  activo: true,
  fechaRegistro: null,
};
const OCHIWAN: EntidadRestaurante = {
  id: 2,
  nombre: 'Ochiwan',
  ubicacion: 'San Juan 229',
  especialidad: 'ASIATICA',
  estado: 'APROBADO',
  strikes: 0,
  activo: true,
  usuarioId: 9,
  email: 'ochiwan@mail.com',
};

describe('AdminEntidadesService', () => {
  let service: AdminEntidadesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminEntidadesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function cargarTodo() {
    const carga = firstValueFrom(service.cargar());
    http.expectOne(`${API}/admin/entidades/clientes`).flush([ANA]);
    http.expectOne(`${API}/admin/entidades/restaurantes`).flush([OCHIWAN]);
    await carga;
  }

  it('carga clientes y restaurantes juntos', async () => {
    await cargarTodo();

    expect(service.clientes()).toEqual([ANA]);
    expect(service.restaurantes()).toEqual([OCHIWAN]);
    expect(service.cargando()).toBe(false);
  });

  it('da de baja un cliente con PATCH y actualiza su fila', async () => {
    await cargarTodo();

    const baja = firstValueFrom(service.cambiarActivoCliente(4, false));
    const req = http.expectOne(`${API}/admin/usuarios/4/activo`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ activo: false });
    req.flush({ id: 4, nombre: 'Ana', activo: false });
    await baja;

    expect(service.clientes()[0].activo).toBe(false);
  });

  it('reactiva un restaurante con PATCH y actualiza su fila', async () => {
    await cargarTodo();

    const alta = firstValueFrom(service.cambiarActivoRestaurante(2, false));
    http
      .expectOne(`${API}/admin/restaurantes/2/activo`)
      .flush({ id: 2, nombre: 'Ochiwan', activo: false });
    await alta;

    expect(service.restaurantes()[0].activo).toBe(false);
  });

  it('si el cambio falla deja la fila como estaba y explica el error', async () => {
    await cargarTodo();

    const baja = firstValueFrom(service.cambiarActivoCliente(4, false));
    http
      .expectOne(`${API}/admin/usuarios/4/activo`)
      .flush(null, { status: 0, statusText: 'Unknown Error' });

    await expect(baja).rejects.toThrow('No se pudo conectar con el servidor.');
    expect(service.clientes()[0].activo).toBe(true);
  });

  it('aplica un strike a un cliente con POST y actualiza sus strikes', async () => {
    await cargarTodo();

    const strike = firstValueFrom(service.aplicarStrike('cliente', 4, 'Lenguaje ofensivo'));
    const req = http.expectOne(`${API}/admin/usuarios/4/strikes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ motivo: 'Lenguaje ofensivo' });
    req.flush({
      id: 4,
      nombre: 'Ana Gómez',
      email: 'ana@mail.com',
      strikes: 2,
      sugerirBaja: false,
      emailEnviado: true,
    });

    expect((await strike).strikes).toBe(2);
    expect(service.clientes()[0].strikes).toBe(2);
  });

  it('aplica un strike a un restaurante en su propio endpoint', async () => {
    await cargarTodo();

    const strike = firstValueFrom(service.aplicarStrike('restaurante', 2, 'Reservas sin aviso'));
    http.expectOne(`${API}/admin/restaurantes/2/strikes`).flush({
      id: 2,
      nombre: 'Ochiwan',
      email: 'ochiwan@mail.com',
      strikes: 3,
      sugerirBaja: true,
      emailEnviado: false,
    });
    await strike;

    expect(service.restaurantes()[0].strikes).toBe(3);
  });

  it('si el strike falla no cambia la fila y devuelve el mensaje del backend', async () => {
    await cargarTodo();

    const strike = firstValueFrom(service.aplicarStrike('cliente', 4, 'Motivo'));
    http
      .expectOne(`${API}/admin/usuarios/4/strikes`)
      .flush(
        { error: 'error de negocio', mensaje: 'No se puede sancionar a un administrador' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expect(strike).rejects.toThrow('No se puede sancionar a un administrador');
    expect(service.clientes()[0].strikes).toBe(1);
  });
});
