import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { fakeJwt, futureExp } from '../../auth/testing';
import { violacionesAxe } from '../../../shared/testing/axe';
import { Header } from './header';

describe('Header', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    return fixture;
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  function logoutButtons(element: HTMLElement): HTMLButtonElement[] {
    return [...element.querySelectorAll('button')].filter((button) =>
      button.getAttribute('aria-label')?.startsWith('Cerrar sesión'),
    );
  }

  it('muestra los accesos de invitado sin una sesión activa', async () => {
    const element = (await render()).nativeElement as HTMLElement;

    expect(element.textContent).toContain('Iniciar sesión');
    expect(element.textContent).toContain('Para restaurantes');
    expect(element.textContent).toContain('Crear cuenta');
    expect(logoutButtons(element)).toHaveLength(0);
  });

  const CLIENTE_TOKEN = fakeJwt({
    sub: 'ana@foodies.com',
    usuarioId: 3,
    roles: ['ROLE_CLIENTE'],
    exp: futureExp(),
  });
  const perfilAna = {
    id: 3,
    email: 'ana@foodies.com',
    telefono: '2235550000',
    rol: 'ROLE_CLIENTE',
    nombre: 'Ana',
    apellido: 'Gómez',
  };

  /** Renders with a client session and answers the profile request the account menu makes. */
  async function renderCliente(perfil: object | null = perfilAna) {
    localStorage.setItem('foodies.token.CLIENTE', CLIENTE_TOKEN);
    const fixture = TestBed.createComponent(Header);
    // The account menu, and its profile request, exist only after the first render.
    await fixture.whenStable();
    const req = TestBed.inject(HttpTestingController).expectOne('/api/clientes/3');
    if (perfil) {
      req.flush(perfil);
    } else {
      req.flush(null, { status: 500, statusText: 'Error' });
    }
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const cuenta = element.querySelector<HTMLButtonElement>('[aria-controls="cliente-menu"]')!;
    const popup = element.querySelector<HTMLElement>('#cliente-menu')!;
    return { fixture, element, cuenta, popup };
  }

  it('muestra el nombre del cliente en vez de "Cliente"', async () => {
    const { element, cuenta, popup } = await renderCliente();

    expect(cuenta.textContent).toContain('Ana');
    expect(cuenta.textContent).not.toContain('Cliente');
    expect(cuenta.getAttribute('aria-expanded')).toBe('false');
    expect(popup.hidden).toBe(true);
    expect(logoutButtons(element)).toHaveLength(0);
    expect(element.textContent).not.toContain('Para restaurantes');
  });

  it('deja solo Restaurantes en la navbar: las reservas están en el popup', async () => {
    const { element } = await renderCliente();

    const nav = element.querySelector('nav[aria-label="Navegación principal"]')!;
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent?.trim())).toEqual([
      'Restaurantes',
    ]);
  });

  it('usa el email de la sesión si no puede traer el perfil', async () => {
    const { cuenta } = await renderCliente(null);

    expect(cuenta.textContent).toContain('ana@foodies.com');
  });

  it('abre un popup con perfil, reseñas, reservas y cerrar sesión', async () => {
    const { fixture, cuenta, popup } = await renderCliente();

    cuenta.click();
    await fixture.whenStable();

    expect(popup.hidden).toBe(false);
    expect(popup.textContent).toContain('Ana Gómez');
    expect(popup.textContent).toContain('ana@foodies.com');
    const links = [...popup.querySelectorAll('a')];
    expect(links.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([
      ['Mi perfil', '/perfil'],
      ['Mis reseñas', '/mis-resenas'],
      ['Mis reservas', '/mis-reservas'],
    ]);
    expect(popup.querySelector('button')?.textContent?.trim()).toBe('Cerrar sesión');
    expect(document.activeElement).toBe(links[0]);
    expect(await violacionesAxe(fixture.nativeElement)).toEqual([]);
  });

  it('cierra el popup con Escape y devuelve el foco al nombre', async () => {
    const { fixture, cuenta, popup } = await renderCliente();
    cuenta.click();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(popup.hidden).toBe(true);
    expect(document.activeElement).toBe(cuenta);
  });

  it('cierra la sesión del cliente desde el popup sin tocar las otras', async () => {
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() }),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const { fixture, element, cuenta, popup } = await renderCliente();
    expect(logoutButtons(element).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Cerrar sesión de Admin',
    ]);

    cuenta.click();
    await fixture.whenStable();
    popup.querySelector('button')!.click();
    await fixture.whenStable();

    expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
    expect(localStorage.getItem('foodies.token.ADMIN')).not.toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(element.querySelector('#cliente-menu')).toBeNull();
  });

  it('muestra la cuenta del cliente en el menú móvil', async () => {
    const { fixture, element } = await renderCliente();

    element.querySelector<HTMLButtonElement>('button[aria-controls="menu-movil"]')!.click();
    await fixture.whenStable();

    const movil = element.querySelector('#menu-movil')!;
    expect(movil.textContent).toContain('Ana Gómez');
    expect([...movil.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/perfil', '/mis-resenas', '/mis-reservas']),
    );
    expect(
      [...movil.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Cerrar sesión'),
    ).toBe(true);
  });

  it('cierra el menú móvil con Escape y devuelve el foco al botón', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector('button[aria-controls="menu-movil"]') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(element.querySelector('#menu-movil')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('abre y cierra el menú móvil', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector('button[aria-controls="menu-movil"]') as HTMLButtonElement;

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#menu-movil')).toBeNull();

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('#menu-movil')).not.toBeNull();
    expect(element.querySelector('#menu-movil')?.textContent).toContain('Iniciar sesión');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#menu-movil')).toBeNull();
  });
});
