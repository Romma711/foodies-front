import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { fakeJwt, futureExp } from '../../core/auth/testing';
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
      providers: [provideRouter([]), provideHttpClient()],
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

  it('lista cada sesión activa con su propio cierre de sesión', async () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() }),
    );
    const element = (await render()).nativeElement as HTMLElement;

    expect(logoutButtons(element).map((button) => button.getAttribute('aria-label'))).toEqual([
      'Cerrar sesión de Admin',
      'Cerrar sesión de Cliente',
    ]);
    expect(element.textContent).toContain('Cliente');
    expect(element.textContent).not.toContain('Para restaurantes');
  });

  it('cierra solo la sesión elegida y abre su login', async () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() }),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    logoutButtons(element)
      .find((button) => button.getAttribute('aria-label') === 'Cerrar sesión de Cliente')
      ?.click();
    await fixture.whenStable();

    expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
    expect(localStorage.getItem('foodies.token.ADMIN')).not.toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(logoutButtons(element)).toHaveLength(1);
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
