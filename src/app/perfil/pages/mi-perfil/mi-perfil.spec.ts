import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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

  describe('dar de baja la cuenta (regla D7)', () => {
    function boton(element: HTMLElement, texto: string): HTMLButtonElement | undefined {
      return [...element.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent?.trim() === texto,
      );
    }

    async function abrirConfirmacion() {
      const fixture = TestBed.createComponent(MiPerfil);
      http.expectOne('/api/clientes/3').flush(perfilCliente());
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      boton(element, 'Dar de baja mi cuenta')!.click();
      await fixture.whenStable();
      return { fixture, element };
    }

    it('pide confirmación en la página y explica que se cancelan las reservas futuras', async () => {
      const { element } = await abrirConfirmacion();

      const confirmacion = element.querySelector('[data-testid="confirmar-baja"]');
      expect(confirmacion?.textContent).toContain('¿Seguro que querés dar de baja tu cuenta?');
      expect(confirmacion?.textContent).toContain('cancelar todas tus reservas futuras');
      http.expectNone({ method: 'DELETE' });
    });

    it('vuelve atrás sin dar de baja con "No, mantener mi cuenta"', async () => {
      const { fixture, element } = await abrirConfirmacion();

      boton(element, 'No, mantener mi cuenta')!.click();
      await fixture.whenStable();

      expect(element.querySelector('[data-testid="confirmar-baja"]')).toBeNull();
      http.expectNone({ method: 'DELETE' });
    });

    it('da de baja, cierra la sesión del cliente y vuelve al inicio', async () => {
      const router = TestBed.inject(Router);
      const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      const { fixture, element } = await abrirConfirmacion();

      boton(element, 'Sí, dar de baja')!.click();
      http.expectOne({ method: 'DELETE', url: '/api/clientes/3' }).flush(null, {
        status: 204,
        statusText: 'No Content',
      });
      await fixture.whenStable();

      expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
      expect(navegar).toHaveBeenCalledWith('/');
    });

    it('muestra el mensaje del servidor si no puede dar de baja', async () => {
      const { fixture, element } = await abrirConfirmacion();

      boton(element, 'Sí, dar de baja')!.click();
      http
        .expectOne({ method: 'DELETE', url: '/api/clientes/3' })
        .flush(
          { error: 'FORBIDDEN', mensaje: 'No podés dar de baja otra cuenta' },
          { status: 403, statusText: 'Forbidden' },
        );
      await fixture.whenStable();

      expect(element.querySelector('[role="alert"]')?.textContent).toContain(
        'No podés dar de baja otra cuenta',
      );
      expect(localStorage.getItem('foodies.token.CLIENTE')).not.toBeNull();
    });
  });
});
