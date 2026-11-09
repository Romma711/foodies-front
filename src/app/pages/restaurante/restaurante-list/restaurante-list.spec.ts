import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { MapaRestaurantes } from '../../../features/mapa/components/mapa-restaurantes/mapa-restaurantes';
import { CalificacionService } from '../../../features/mapa/services/calificacion.service';
import { RestauranteListDTO } from '../models/restaurante.models';
import { RestauranteService } from '../services/restaurante.service';
import { RestauranteList } from './restaurante-list';

describe('RestauranteList', () => {
  const restaurantesMock: RestauranteListDTO[] = [
    {
      id: 5,
      nombre: 'Ochiwan',
      ubicacion: 'San juan 229',
      especialidad: 'ASIATICA',
      fotoPortada: '/api/files/fotos/5/portada.jpg',
    },
    {
      id: 6,
      nombre: 'La Trattoria',
      ubicacion: 'Av. Siempre Viva 742',
      especialidad: 'PASTAS',
      fotoPortada: null,
    },
  ];

  let restaurantes: WritableSignal<RestauranteListDTO[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let listar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    restaurantes = signal(restaurantesMock);
    cargando = signal(false);
    error = signal<string | null>(null);
    listar = vi.fn(() => of(restaurantes()));

    await TestBed.configureTestingModule({
      imports: [RestauranteList],
      providers: [
        provideRouter([]),
        {
          provide: CalificacionService,
          useValue: { promedio: vi.fn(() => of({ promedio: 0, total: 0 })) },
        },
        {
          provide: RestauranteService,
          useValue: {
            restaurantes: restaurantes.asReadonly(),
            loading: cargando.asReadonly(),
            error: error.asReadonly(),
            listar,
          },
        },
      ],
    }).compileComponents();
  });

  function crearComponente() {
    const fixture = TestBed.createComponent(RestauranteList);
    fixture.detectChanges();
    return fixture;
  }

  it('debería listar los restaurantes con su especialidad y ubicación', () => {
    const fixture = crearComponente();
    const texto = fixture.nativeElement.textContent as string;

    expect(listar).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(2);
    expect(texto).toContain('Ochiwan');
    expect(texto).toContain('San juan 229');
    expect(texto).toContain('Asiática');
  });

  it('debería usar la portada como miniatura, y la portada genérica si no hay foto', () => {
    const fixture = crearComponente();
    const tarjetas = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;

    expect(tarjetas[0].querySelector('img.portada')?.getAttribute('src')).toBe(
      '/api/files/fotos/5/portada.jpg',
    );
    expect(tarjetas[1].querySelector('img.portada')).toBeNull();
    expect(tarjetas[1].textContent).toContain('L');
  });

  it('debería mostrar el estado de carga', () => {
    cargando.set(true);
    const fixture = crearComponente();

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
  });

  it('debería mostrar el estado vacío', () => {
    restaurantes.set([]);
    const fixture = crearComponente();

    expect(fixture.nativeElement.textContent).toContain('Todavía no hay restaurantes');
  });

  it('debería mostrar el error y permitir reintentar', () => {
    error.set('No se pudo conectar con el servidor.');
    const fixture = crearComponente();
    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alerta.textContent).toContain('No se pudo conectar con el servidor.');

    (alerta.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(listar).toHaveBeenCalledTimes(2);
  });
  it('arranca en la vista de lista con el selector marcando "Lista"', () => {
    const fixture = crearComponente();
    const host = fixture.nativeElement as HTMLElement;

    const lista = host.querySelector<HTMLButtonElement>('[data-testid="vista-lista"]');
    const mapa = host.querySelector<HTMLButtonElement>('[data-testid="vista-mapa"]');
    expect(lista?.getAttribute('aria-pressed')).toBe('true');
    expect(mapa?.getAttribute('aria-pressed')).toBe('false');
    expect(host.querySelector('app-mapa-restaurantes')).toBeNull();
  });

  it('muestra el mapa al elegir la vista "Mapa" y vuelve a la lista', () => {
    const fixture = crearComponente();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-testid="vista-mapa"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('app-mapa-restaurantes')).not.toBeNull();
    expect(host.querySelectorAll('ul > li').length).toBe(0);
    expect(host.querySelector('[data-testid="vista-mapa"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );

    host.querySelector<HTMLButtonElement>('[data-testid="vista-lista"]')!.click();
    fixture.detectChanges();

    expect(host.querySelector('app-mapa-restaurantes')).toBeNull();
    expect(host.querySelectorAll('ul > li').length).toBe(2);
  });
  function botonFiltro(host: HTMLElement, etiqueta: string): HTMLButtonElement {
    return [
      ...host.querySelectorAll<HTMLButtonElement>('[data-testid="filtro-especialidad"] button'),
    ].find((boton) => boton.textContent?.trim() === etiqueta)!;
  }

  function nombres(host: HTMLElement): string[] {
    return [...host.querySelectorAll('ul > li h2')].map((h2) => h2.textContent?.trim() ?? '');
  }

  it('filtra por especialidad y "Todas" vuelve a mostrar todos', () => {
    const fixture = crearComponente();
    const host = fixture.nativeElement as HTMLElement;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    expect(botonFiltro(host, 'Todas').getAttribute('aria-pressed')).toBe('true');

    botonFiltro(host, 'Pastas').click();
    fixture.detectChanges();

    expect(nombres(host)).toEqual(['La Trattoria']);
    expect(botonFiltro(host, 'Pastas').getAttribute('aria-pressed')).toBe('true');
    expect(navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: { especialidad: 'PASTAS' } }),
    );

    botonFiltro(host, 'Todas').click();
    fixture.detectChanges();

    expect(nombres(host)).toEqual(['Ochiwan', 'La Trattoria']);
    expect(navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: { especialidad: null } }),
    );
  });

  it('aplica la especialidad que llega por la URL', () => {
    const fixture = TestBed.createComponent(RestauranteList);
    fixture.componentRef.setInput('especialidad', 'ASIATICA');
    fixture.detectChanges();

    expect(nombres(fixture.nativeElement as HTMLElement)).toEqual(['Ochiwan']);
  });

  it('avisa cuando no hay restaurantes de la especialidad elegida', () => {
    const fixture = TestBed.createComponent(RestauranteList);
    fixture.componentRef.setInput('especialidad', 'CAFE');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="sin-resultados"]')?.textContent).toContain(
      'Todavía no hay restaurantes de Café',
    );
  });

  it('el mapa recibe solo los restaurantes filtrados', () => {
    const fixture = TestBed.createComponent(RestauranteList);
    fixture.componentRef.setInput('especialidad', 'PASTAS');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-testid="vista-mapa"]')!.click();
    fixture.detectChanges();

    const mapa = fixture.debugElement.query(By.css('app-mapa-restaurantes'));
    expect(
      (mapa.componentInstance as MapaRestaurantes).restaurantes().map((r) => r.nombre),
    ).toEqual(['La Trattoria']);
  });
});
