import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { fakeJwt, futureExp } from '../../core/auth/testing';
import { Footer } from './footer';

describe('Footer', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Footer);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function enlaces(element: HTMLElement): string[] {
    return [...element.querySelectorAll('nav a')].map((a) => a.textContent?.trim() ?? '');
  }

  it('muestra "Iniciar sesión" y "Crear cuenta" sin sesión', async () => {
    const element = await render();

    expect(enlaces(element)).toEqual([
      'Restaurantes',
      'Iniciar sesión',
      'Crear cuenta',
      'Para restaurantes',
    ]);
  });

  it('con la sesión del cliente oculta los accesos de invitado y muestra los de la cuenta', async () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ sub: 'ana@foodies.com', usuarioId: 3, roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );

    const element = await render();
    const textos = enlaces(element);

    expect(textos).not.toContain('Iniciar sesión');
    expect(textos).not.toContain('Crear cuenta');
    expect(textos).toEqual(
      expect.arrayContaining(['Mis reservas', 'Mis reseñas', 'Mi perfil']),
    );
    expect(element.querySelector('a[href="/mis-reservas"]')).not.toBeNull();
  });
});
