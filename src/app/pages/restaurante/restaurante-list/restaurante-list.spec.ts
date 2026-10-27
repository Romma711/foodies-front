import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { RestauranteListDTO } from '../models/restaurante.models';
import { RestauranteService } from '../services/restaurante.service';
import { RestauranteList } from './restaurante-list';

describe('RestauranteList', () => {
  const restaurantesMock: RestauranteListDTO[] = [
    { id: 5, nombre: 'Ochiwan', ubicacion: 'San juan 229', especialidad: 'ASIATICA' },
    { id: 6, nombre: 'La Trattoria', ubicacion: 'Av. Siempre Viva 742', especialidad: 'PASTAS' },
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
});
