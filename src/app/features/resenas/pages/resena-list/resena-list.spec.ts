import { WritableSignal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ResenaForm } from '../../components/resena-form/resena-form';
import { ResenaDetailDTO, ResenaListDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';
import { ResenaList } from './resena-list';

describe('ResenaList', () => {
  const mock: ResenaListDTO[] = [
    {
      id: 1,
      nombreUsuario: 'Ana Gómez',
      comentario: 'La pasta estaba increíble.',
      calificacion: 5,
    },
    {
      id: 2,
      nombreUsuario: 'Luis Pérez',
      comentario: 'Muy buena atención y ambiente.',
      calificacion: 4,
    },
  ];

  const detalle: ResenaDetailDTO = {
    id: 30,
    comentario: 'La pasta estaba increíble.',
    calificacion: 5,
    nombreUsuario: 'Ana',
    nombreRestaurant: 'Ochiwan',
  };

  let resenas: WritableSignal<ResenaListDTO[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let autenticado: WritableSignal<boolean>;
  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let listarPorRestaurante: ReturnType<typeof vi.fn>;
  let crear: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resenas = signal(mock);
    cargando = signal(false);
    error = signal<string | null>(null);
    autenticado = signal(false);
    saving = signal(false);
    mutationError = signal<string | null>(null);
    listarPorRestaurante = vi.fn(() => of(mock));
    crear = vi.fn(() => of(detalle));

    await TestBed.configureTestingModule({
      imports: [ResenaList],
      providers: [
        provideRouter([]),
        {
          provide: ResenaService,
          useValue: {
            resenas: resenas.asReadonly(),
            loading: cargando.asReadonly(),
            error: error.asReadonly(),
            saving: saving.asReadonly(),
            mutationError: mutationError.asReadonly(),
            totalResenas: computed(() => resenas().length),
            promedioCalificacion: computed(() => {
              const items = resenas();
              if (items.length === 0) {
                return 0;
              }
              const total = items.reduce((suma, item) => suma + item.calificacion, 0);
              return Math.round((total / items.length) * 10) / 10;
            }),
            listarPorRestaurante,
            crear,
          },
        },
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => autenticado() },
        },
      ],
    }).compileComponents();
  });

  function crearComponente(restauranteId = '5') {
    const fixture = TestBed.createComponent(ResenaList);
    fixture.componentRef.setInput('restauranteId', restauranteId);
    fixture.detectChanges();
    return fixture;
  }

  it('debería pedir las reseñas del restaurante de la ruta', async () => {
    const fixture = crearComponente('5');
    await fixture.whenStable();

    expect(listarPorRestaurante).toHaveBeenCalledWith(5);
    expect(fixture.nativeElement.querySelectorAll('app-resena-card').length).toBe(2);
  });

  it('debería mostrar el promedio y el total de reseñas', () => {
    const fixture = crearComponente('5');
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('4.5');
    expect(texto).toContain('2 reseñas');
  });

  it('debería mostrar el estado de carga', () => {
    cargando.set(true);
    const fixture = crearComponente('5');

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });

  it('debería mostrar el estado vacío', () => {
    resenas.set([]);
    const fixture = crearComponente('5');
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Todavía no hay reseñas');
    expect(fixture.nativeElement.querySelectorAll('app-resena-card').length).toBe(0);
  });

  it('debería mostrar el error y permitir reintentar', () => {
    error.set('No se pudo conectar con el servidor.');
    const fixture = crearComponente('5');
    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alerta.textContent).toContain('No se pudo conectar con el servidor.');

    const boton = alerta.querySelector('button') as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();

    expect(listarPorRestaurante).toHaveBeenCalledTimes(2);
  });

  it('debería invitar a iniciar sesión a los visitantes', () => {
    const fixture = crearComponente('5');
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('Iniciá sesión como cliente');
    expect(fixture.nativeElement.querySelector('app-resena-form')).toBeNull();
  });

  it('debería permitir abrir el formulario a un cliente autenticado', () => {
    autenticado.set(true);
    const fixture = crearComponente('5');
    const boton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((item) => item.textContent?.includes('Escribir reseña'));

    expect(boton).toBeTruthy();
    boton?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-resena-form')).not.toBeNull();
  });

  it('debería ocultar el formulario y mostrar el éxito al crear una reseña', () => {
    autenticado.set(true);
    const fixture = crearComponente('5');
    const boton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((item) => item.textContent?.includes('Escribir reseña'));
    boton?.click();
    fixture.detectChanges();

    const formulario = fixture.debugElement.query(By.directive(ResenaForm));
    expect(formulario).toBeTruthy();
    (formulario.componentInstance as ResenaForm).creada.emit(detalle);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('¡Gracias, Ana! Tu reseña ya está publicada.');
    expect(fixture.nativeElement.querySelector('app-resena-form')).toBeNull();
  });
});
