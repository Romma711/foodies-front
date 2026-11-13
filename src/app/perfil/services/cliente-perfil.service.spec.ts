import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AUTH_ROLE } from '../../core/auth/auth-context';
import { fakeJwt, futureExp } from '../../core/auth/testing';
import { ClientePerfil, ClientePerfilService } from './cliente-perfil.service';

export function perfilCliente(overrides: Partial<ClientePerfil> = {}): ClientePerfil {
  return {
    id: 3,
    email: 'ana@foodies.com',
    telefono: '2235550000',
    rol: 'ROLE_CLIENTE',
    nombre: 'Ana',
    apellido: 'Gómez',
    ...overrides,
  };
}

export const CLIENTE_TOKEN = fakeJwt({
  sub: 'ana@foodies.com',
  usuarioId: 3,
  roles: ['ROLE_CLIENTE'],
  exp: futureExp(),
});

describe('ClientePerfilService', () => {
  let service: ClientePerfilService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('foodies.token.CLIENTE', CLIENTE_TOKEN);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientePerfilService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the signed-in client with its own session', () => {
    service.cargar().subscribe();

    const req = http.expectOne({ method: 'GET', url: '/api/clientes/3' });
    expect(req.request.context.get(AUTH_ROLE)).toBe('CLIENTE');
    req.flush(perfilCliente());

    expect(service.nombreVisible()).toBe('Ana');
    expect(service.nombreCompleto()).toBe('Ana Gómez');
  });

  it('falls back to the session email while the client has no name', () => {
    expect(service.nombreVisible()).toBe('ana@foodies.com');

    service.cargar().subscribe();
    http.expectOne('/api/clientes/3').flush(perfilCliente({ nombre: ' ', apellido: null }));

    expect(service.nombreVisible()).toBe('ana@foodies.com');
    expect(service.nombreCompleto()).toBe('ana@foodies.com');
  });

  it('reports a readable error', () => {
    service.cargar().subscribe({ error: () => undefined });

    http.expectOne('/api/clientes/3').flush(null, { status: 0, statusText: 'Unknown Error' });

    expect(service.error()).toBe('No se pudo conectar con el servidor.');
    expect(service.cargando()).toBe(false);
  });

  it('asks for nothing without a client session and forgets the profile on clear', () => {
    service.cargar().subscribe();
    http.expectOne('/api/clientes/3').flush(perfilCliente());

    service.limpiar();
    expect(service.perfil()).toBeNull();

    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientePerfilService);
    http = TestBed.inject(HttpTestingController);
    service.cargar().subscribe();
    http.expectNone('/api/clientes/3');
  });
});
