import { Component, input } from '@angular/core';
import { RestauranteResenas } from '../../../features/resenas/components/restaurante-resenas/restaurante-resenas';
import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ReservaService } from '../../../features/reservas/services/reserva.service';
import { CartaPublicaDTO, RestauranteDetailDTO } from '../models/restaurante.models';
import { RestauranteService } from '../services/restaurante.service';
import { RestauranteDetail } from './restaurante-detail';

@Component({ selector: 'app-restaurante-resenas', template: '' })
class RestauranteResenasStub {
  readonly restauranteId = input<number>();
  readonly nombreRestaurante = input('');
}

describe('RestauranteDetail', () => {
  const detalle: RestauranteDetailDTO = {
    id: 5,
    nombre: 'Ochiwan',
    cupoMaximo: 15,
    ubicacion: 'San juan 229',
    especialidad: 'ASIATICA',
  };

  let restaurante: WritableSignal<RestauranteDetailDTO | null>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let cliente: WritableSignal<boolean>;
  let usuarioId: WritableSignal<number | null>;
  let obtener: ReturnType<typeof vi.fn>;
  let obtenerCarta: ReturnType<typeof vi.fn>;
  let carta: CartaPublicaDTO | null;
  let limpiar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    restaurante = signal<RestauranteDetailDTO | null>(detalle);
    cargando = signal(false);
    error = signal<string | null>(null);
    cliente = signal(false);
    usuarioId = signal<number | null>(null);
    obtener = vi.fn(() => {
      restaurante.set(detalle);
      return of(detalle);
    });
    limpiar = vi.fn();
    carta = {
      id: 3,
      nombreArchivo: 'carta.pdf',
      url: '/api/files/cartas/5/a.pdf',
      tamanioBytes: 2048,
      actualizadaEn: '2026-10-20T12:00:00Z',
    };
    obtenerCarta = vi.fn(() => of(carta));

    TestBed.overrideComponent(RestauranteDetail, {
      remove: { imports: [RestauranteResenas] },
      add: { imports: [RestauranteResenasStub] },
    });

    await TestBed.configureTestingModule({
      imports: [RestauranteDetail],
      providers: [
        provideRouter([]),
        {
          provide: RestauranteService,
          useValue: {
            restaurante: restaurante.asReadonly(),
            loading: cargando.asReadonly(),
            error: error.asReadonly(),
            obtener,
            obtenerCarta,
            limpiar,
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: vi.fn(() => cliente()),
            userId: vi.fn(() => usuarioId()),
          },
        },
        {
          provide: ReservaService,
          useValue: {
            saving: signal(false).asReadonly(),
            mutationError: signal<string | null>(null).asReadonly(),
            crear: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  function crearComponente(restauranteId = '5') {
    const fixture = TestBed.createComponent(RestauranteDetail);
    fixture.componentRef.setInput('restauranteId', restauranteId);
    fixture.detectChanges();
    return fixture;
  }

  it('debería cargar el restaurante de la ruta y mostrar sus datos', () => {
    const fixture = crearComponente();
    const texto = fixture.nativeElement.textContent as string;

    expect(obtener).toHaveBeenCalledWith(5);
    expect(texto).toContain('Ochiwan');
    expect(texto).toContain('San juan 229');
    expect(texto).toContain('Asiática');
  });

  it('no debería mostrar la capacidad del restaurante', () => {
    const fixture = crearComponente();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).not.toContain('Capacidad');
    expect(texto).not.toContain('15');
  });

  it('debería mostrar un botón para ver la carta en una pestaña nueva', () => {
    const fixture = crearComponente();
    const enlace = Array.from(
      fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>,
    ).find((item) => item.textContent?.includes('Ver carta'));

    expect(obtenerCarta).toHaveBeenCalledWith(5);
    expect(enlace?.getAttribute('href')).toBe('/api/files/cartas/5/a.pdf');
    expect(enlace?.getAttribute('target')).toBe('_blank');
    expect(enlace?.getAttribute('rel')).toBe('noopener');
  });

  it('no debería mostrar el botón de la carta si el restaurante no subió una', () => {
    carta = null;
    const fixture = crearComponente();

    expect(fixture.nativeElement.textContent).not.toContain('Ver carta');
  });

  it('no debería pedir datos si el id no es válido', () => {
    const fixture = crearComponente('no-es-un-id');

    expect(obtener).not.toHaveBeenCalled();
    expect(obtenerCarta).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('El restaurante solicitado no es válido');
  });

  it('debería invitar a iniciar sesión a los visitantes', () => {
    const fixture = crearComponente();
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Iniciá sesión para reservar');
    expect(fixture.nativeElement.querySelector('app-reserva-form')).toBeNull();
  });

  it('debería permitir abrir el formulario a un cliente autenticado', () => {
    cliente.set(true);
    usuarioId.set(29);
    const fixture = crearComponente();
    const boton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((item) => item.textContent?.includes('Reservar mesa'));

    expect(boton).toBeTruthy();
    boton?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-reserva-form')).not.toBeNull();
  });

  it('debería mostrar el error y permitir reintentar', () => {
    restaurante.set(null);
    error.set('El restaurante no existe.');
    const fixture = crearComponente();
    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alerta.textContent).toContain('El restaurante no existe.');

    (alerta.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(obtener).toHaveBeenCalledTimes(2);
  });
});
