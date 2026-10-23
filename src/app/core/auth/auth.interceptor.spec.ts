import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { withRole } from './auth-context';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { fakeJwt, futureExp } from './testing';

describe('authInterceptor', () => {
  const clienteToken = fakeJwt({ role: 'CLIENTE', exp: futureExp() });
  const adminToken = fakeJwt({ role: 'ADMIN', exp: futureExp() });
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('foodies.token.CLIENTE', clienteToken);
    localStorage.setItem('foodies.token.ADMIN', adminToken);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('attaches only the token of the role in the request context', () => {
    client.get('/orders', { context: withRole('CLIENTE') }).subscribe();
    client.get('/users', { context: withRole('ADMIN') }).subscribe();

    const orders = http.expectOne('/orders');
    const users = http.expectOne('/users');
    expect(orders.request.headers.get('Authorization')).toBe(`Bearer ${clienteToken}`);
    expect(users.request.headers.get('Authorization')).toBe(`Bearer ${adminToken}`);
    orders.flush([]);
    users.flush([]);
  });

  it('sends requests without a role anonymously', () => {
    client.get('/restaurants').subscribe();

    const req = http.expectOne('/restaurants');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('signs out the role when the backend answers 401', () => {
    const auth = TestBed.inject(AuthService);
    client.get('/orders', { context: withRole('CLIENTE') }).subscribe({ error: () => undefined });

    http.expectOne('/orders').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated('CLIENTE')).toBe(false);
    expect(auth.isAuthenticated('ADMIN')).toBe(true);
  });
});
