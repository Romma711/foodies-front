import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { violacionesAxe } from '../../../shared/testing/axe';
import { CLIENTE_TOKEN, perfilCliente } from '../../services/cliente-perfil.service.spec';
import { MiPerfil } from './mi-perfil';

describe('MiPerfil', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('foodies.token.CLIENTE', CLIENTE_TOKEN);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(responder: (req: ReturnType<HttpTestingController['expectOne']>) => void) {
    const fixture = TestBed.createComponent(MiPerfil);
    responder(http.expectOne('/api/clientes/3'));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the account data and links to the client activity', async () => {
    const element = await render((req) => req.flush(perfilCliente()));

    expect(element.querySelector('h2')?.textContent).toContain('Ana Gómez');
    expect(element.textContent).toContain('ana@foodies.com');
    expect(element.textContent).toContain('2235550000');
    expect([...element.querySelectorAll('nav a')].map((a) => a.getAttribute('href'))).toEqual([
      '/mis-resenas',
      '/mis-reservas',
    ]);
    expect(await violacionesAxe(element)).toEqual([]);
  });

  it('shows the error with a retry', async () => {
    const element = await render((req) => req.flush(null, { status: 404, statusText: 'x' }));

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No encontramos tu cuenta.',
    );
    expect(element.querySelector('[role="alert"] button')?.textContent?.trim()).toBe('Reintentar');
  });
});
