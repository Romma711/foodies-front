import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PendingApprovalError, RoleMismatchError } from './auth.models';
import { AuthService } from './auth.service';
import { fakeJwt, futureExp } from './testing';

const API = '/api';

/** Same shape as the backend: `{ "Token": "Bearer <jwt>" }` with `roles: ["ROLE_X"]`. */
const loginResponse = (token: string) => ({ Token: `Bearer ${token}` });

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  const login = (role: Parameters<AuthService['login']>[1]) =>
    firstValueFrom(auth.login({ email: 'ana@foodies.com', password: 'x' }, role));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the raw token, without the Bearer prefix, under its role', async () => {
    const token = fakeJwt({ sub: 'ana@foodies.com', roles: ['ROLE_CLIENTE'], exp: futureExp() });
    const session = login('CLIENTE');

    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@foodies.com', password: 'x' });
    req.flush(loginResponse(token));

    await expect(session).resolves.toEqual({ role: 'CLIENTE', subject: 'ana@foodies.com', token });
    expect(localStorage.getItem('foodies.token.CLIENTE')).toBe(token);
    expect(auth.isAuthenticated('CLIENTE')).toBe(true);
    expect(auth.isAuthenticated('ADMIN')).toBe(false);
  });

  it('signs ROLE_ENCARGADO into the restaurant portal', async () => {
    const token = fakeJwt({ roles: ['ROLE_ENCARGADO'], exp: futureExp() });
    const session = login('RESTAURANTE');

    http.expectOne(`${API}/auth/login`).flush(loginResponse(token));

    await expect(session).resolves.toMatchObject({ role: 'RESTAURANTE' });
    expect(localStorage.getItem('foodies.token.RESTAURANTE')).toBe(token);
  });

  it('rejects a restaurant pending approval and stores nothing', async () => {
    const session = login('RESTAURANTE');

    http
      .expectOne(`${API}/auth/login`)
      .flush(loginResponse(fakeJwt({ roles: ['ROLE_PENDIENTE'], exp: futureExp() })));

    await expect(session).rejects.toBeInstanceOf(PendingApprovalError);
    expect(localStorage.getItem('foodies.token.RESTAURANTE')).toBeNull();
  });

  it('rejects a token from another role and stores nothing', async () => {
    const session = login('ADMIN');

    http
      .expectOne(`${API}/auth/login`)
      .flush(loginResponse(fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() })));

    await expect(session).rejects.toBeInstanceOf(RoleMismatchError);
    expect(localStorage.getItem('foodies.token.ADMIN')).toBeNull();
    expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
    expect(auth.isAuthenticated('ADMIN')).toBe(false);
  });

  it('treats expired tokens as signed out', () => {
    localStorage.setItem(
      'foodies.token.RESTAURANTE',
      fakeJwt({ roles: ['ROLE_ENCARGADO'], exp: 1 }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    expect(TestBed.inject(AuthService).token('RESTAURANTE')).toBeNull();
    http = TestBed.inject(HttpTestingController);
  });

  it('logout only clears the given role', () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() }),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);

    auth.logout('CLIENTE');

    expect(auth.isAuthenticated('CLIENTE')).toBe(false);
    expect(auth.isAuthenticated('ADMIN')).toBe(true);
    expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
  });

  it('registers clients and restaurants with the backend DTOs', () => {
    const cliente = {
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@foodies.com',
      password: 'secret123',
      telefono: '2235550000',
    };
    const restaurante = {
      email: 'luis@foodies.com',
      password: 'secret123',
      nombreRestaurante: 'La Parrilla',
      direccion: 'Calle 1',
      telefono: '2235551111',
      especialidadDeComida: 'PARRILLA' as const,
      cupoMaximo: 40,
    };
    auth.registerCliente(cliente).subscribe();
    auth.registerRestaurante(restaurante).subscribe();

    const clienteReq = http.expectOne(`${API}/auth/register/cliente`);
    const restauranteReq = http.expectOne(`${API}/auth/register/restaurante`);
    expect(clienteReq.request.body).toEqual(cliente);
    expect(restauranteReq.request.body).toEqual(restaurante);
    clienteReq.flush({});
    restauranteReq.flush({});
  });
});
