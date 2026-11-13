import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { RestauranteListDTO } from '../../../pages/restaurante/models/restaurante.models';
import { RestauranteService } from '../../../pages/restaurante/services/restaurante.service';
import { Home } from './home';

describe('Home', () => {
  const restaurante = (id: number): RestauranteListDTO => ({
    id,
    nombre: `Restaurante ${id}`,
    ubicacion: `Calle ${id}`,
    especialidad: 'PASTAS',
    fotoPortada: null,
  });

  let restaurantes: WritableSignal<RestauranteListDTO[]>;
  let cargando: WritableSignal<boolean>;
  let esCliente: boolean;
  let listar: ReturnType<typeof vi.fn<() => ReturnType<RestauranteService['listar']>>>;

  beforeEach(async () => {
    restaurantes = signal([]);
    cargando = signal(false);
    esCliente = false;
    listar = vi.fn<() => ReturnType<RestauranteService['listar']>>(() => of(restaurantes()));

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: RestauranteService,
          useValue: {
            restaurantes: restaurantes.asReadonly(),
            loading: cargando.asReadonly(),
            listar: () => listar(),
          },
        },
        { provide: AuthService, useValue: { isAuthenticated: () => esCliente } },
      ],
    }).compileComponents();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function links(element: HTMLElement): string[] {
    return Array.from(element.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');
  }

  it('muestra el hero con el acceso al catálogo y al registro', () => {
    const element = render();

    expect(element.querySelector('h1')?.textContent).toContain('Tu próxima mesa');
    expect(links(element)).toContain('/restaurantes');
    expect(links(element)).toContain('/register');
    expect(links(element)).toContain('/restaurante/register');
    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('le ofrece sus reservas al cliente logueado en vez del registro', () => {
    esCliente = true;
    const element = render();

    expect(links(element)).toContain('/mis-reservas');
    expect(links(element)).not.toContain('/register');
  });

  it('destaca hasta tres restaurantes', () => {
    restaurantes.set([1, 2, 3, 4].map(restaurante));
    const element = render();

    expect(links(element).filter((href) => /^\/restaurantes\/\d+$/.test(href))).toEqual([
      '/restaurantes/1',
      '/restaurantes/2',
      '/restaurantes/3',
    ]);
  });

  it('oculta los destacados si no hay restaurantes o falla la carga', () => {
    listar.mockReturnValue(throwError(() => new Error('sin conexión')));
    const element = render();

    expect(element.querySelector('#home-destacados')).toBeNull();
    expect(element.querySelector('h1')).not.toBeNull();
  });
  it('cada especialidad lleva al catálogo filtrado por ella', () => {
    const element = render();
    const chips = element.querySelectorAll<HTMLAnchorElement>(
      '[aria-label="Especialidades disponibles"] a',
    );
    const pastas = [...chips].find((chip) => chip.textContent?.trim() === 'Pastas');

    expect(chips.length).toBe(6);
    expect(pastas?.getAttribute('href')).toBe('/restaurantes?especialidad=PASTAS');
  });

  it('el buscador lleva al catálogo filtrado por nombre', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const element = render();
    const campo = element.querySelector<HTMLInputElement>('#home-buscar')!;
    const form = element.querySelector<HTMLFormElement>('form[role="search"]')!;

    campo.value = '  Ochiwan ';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(navigate).toHaveBeenLastCalledWith(['/restaurantes'], { queryParams: { q: 'Ochiwan' } });

    campo.value = '';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(navigate).toHaveBeenLastCalledWith(['/restaurantes'], { queryParams: {} });
  });
});
