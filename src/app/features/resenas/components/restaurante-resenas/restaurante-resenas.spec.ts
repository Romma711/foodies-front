import { WritableSignal, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { BAR_CHART_FACTORY } from '../../../../shared/charts/bar-chart-factory';
import { ResenaForm } from '../resena-form/resena-form';
import { ResenaDetailDTO, ResenaListDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';
import { RestauranteResenas } from './restaurante-resenas';

describe('RestauranteResenas', () => {
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
  let admin: WritableSignal<boolean>;
  let eliminar: ReturnType<typeof vi.fn>;
  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let listarPorRestaurante: ReturnType<typeof vi.fn>;
  let crear: ReturnType<typeof vi.fn>;
  let misResenaIds: WritableSignal<ReadonlySet<number>>;
  let cargarMisResenas: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    resenas = signal(mock);
    cargando = signal(false);
    error = signal<string | null>(null);
    autenticado = signal(false);
    admin = signal(false);
    eliminar = vi.fn(() => of(undefined));
    saving = signal(false);
    mutationError = signal<string | null>(null);
    listarPorRestaurante = vi.fn(() => of(mock));
    crear = vi.fn(() => of(detalle));
    misResenaIds = signal<ReadonlySet<number>>(new Set());
    cargarMisResenas = vi.fn(() => of(new Set<number>()));

    await TestBed.configureTestingModule({
      imports: [RestauranteResenas],
      providers: [
        provideRouter([]),
        {
          provide: BAR_CHART_FACTORY,
          useValue: () => ({ data: { datasets: [] }, update: vi.fn(), destroy: vi.fn() }),
        },
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
            distribucionCalificaciones: computed(() =>
              [5, 4, 3, 2, 1].map((estrellas) => ({
                estrellas,
                cantidad: resenas().filter((item) => item.calificacion === estrellas).length,
              })),
            ),
            misResenaIds: misResenaIds.asReadonly(),
            cargarMisResenas,
            eliminar,
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: (rol: string) => (rol === 'ADMIN' ? admin() : autenticado()),
            userId: () => (autenticado() ? 3 : null),
          },
        },
      ],
    }).compileComponents();
  });

  function crearComponente(restauranteId = '5') {
    const fixture = TestBed.createComponent(RestauranteResenas);
    fixture.componentRef.setInput('restauranteId', Number(restauranteId));
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

  it('debería mostrar la distribución de calificaciones en el resumen', () => {
    const fixture = crearComponente('5');
    const resumen = fixture.nativeElement.querySelector(
      '[aria-label="Resumen de calificaciones"]',
    ) as HTMLElement;

    expect(resumen.querySelector('app-rating-distribution')).not.toBeNull();
  });

  it('debería mostrar skeletons accesibles mientras carga', () => {
    cargando.set(true);
    const fixture = crearComponente('5');
    const elemento = fixture.nativeElement as HTMLElement;
    const carga = elemento.querySelector('[data-testid="resenas-cargando"]') as HTMLElement;

    expect(carga.getAttribute('role')).toBe('status');
    expect(carga.textContent).toContain('Cargando reseñas…');
    expect(carga.querySelectorAll('[data-testid="resena-skeleton"]').length).toBe(3);
    expect(elemento.querySelectorAll('app-resena-card').length).toBe(0);
  });

  it('debería avisar las acciones con un toast en lugar de un banner fijo', () => {
    autenticado.set(true);
    misResenaIds.set(new Set([1]));
    const fixture = crearComponente('5');
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Eliminar reseña"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find((item) => item.textContent?.trim() === 'Eliminar')
      ?.click();
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('[data-testid="toast"]') as HTMLElement;
    expect(toast.textContent).toContain('Tu reseña se eliminó.');
    expect(toast.closest('[role="status"]')).not.toBeNull();
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

  describe('con reseñas propias', () => {
    beforeEach(() => {
      autenticado.set(true);
      misResenaIds.set(new Set([1]));
    });

    function botonesEditar(fixture: ReturnType<typeof crearComponente>) {
      return fixture.nativeElement.querySelectorAll(
        'button[aria-label="Editar tu reseña"]',
      ) as NodeListOf<HTMLButtonElement>;
    }

    it('debería cargar los ids propios del cliente autenticado', () => {
      crearComponente('5');

      expect(cargarMisResenas).toHaveBeenCalledWith(3);
    });

    it('debería ofrecer editar solo la reseña propia', () => {
      const fixture = crearComponente('5');

      expect(botonesEditar(fixture).length).toBe(1);
    });

    it('no debería invitar a escribir otra reseña si ya opinó', () => {
      const fixture = crearComponente('5');
      const texto = fixture.nativeElement.textContent as string;

      expect(texto).not.toContain('Escribir reseña');
    });

    it('debería editar inline y mostrar el éxito al guardar', () => {
      const fixture = crearComponente('5');
      botonesEditar(fixture)[0].click();
      fixture.detectChanges();

      const formulario = fixture.debugElement.query(By.directive(ResenaForm));
      expect(formulario).toBeTruthy();
      expect((formulario.componentInstance as ResenaForm).resena()?.id).toBe(1);
      expect(fixture.nativeElement.querySelectorAll('app-resena-card').length).toBe(1);

      (formulario.componentInstance as ResenaForm).actualizada.emit(detalle);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-resena-form')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Tu reseña se actualizó.');
    });
  });

  describe('eliminación por rol', () => {
    function botonesEliminar(fixture: ReturnType<typeof crearComponente>) {
      return Array.from(
        fixture.nativeElement.querySelectorAll(
          'button[aria-label="Eliminar reseña"]',
        ) as NodeListOf<HTMLButtonElement>,
      );
    }

    function confirmar(fixture: ReturnType<typeof crearComponente>, indice: number) {
      botonesEliminar(fixture)[indice].click();
      fixture.detectChanges();
      const confirmacion = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((item) => item.textContent?.trim() === 'Eliminar');
      confirmacion?.click();
      fixture.detectChanges();
    }

    it('no debería ofrecer eliminar a los visitantes', () => {
      const fixture = crearComponente('5');

      expect(botonesEliminar(fixture).length).toBe(0);
    });

    it('debería permitir al cliente eliminar solo su reseña', () => {
      autenticado.set(true);
      misResenaIds.set(new Set([1]));
      const fixture = crearComponente('5');

      expect(botonesEliminar(fixture).length).toBe(1);
      confirmar(fixture, 0);

      expect(eliminar).toHaveBeenCalledWith(1, 'CLIENTE');
      expect(fixture.nativeElement.textContent).toContain('Tu reseña se eliminó.');
    });

    it('debería permitir al administrador moderar cualquier reseña', () => {
      admin.set(true);
      const fixture = crearComponente('5');

      expect(botonesEliminar(fixture).length).toBe(2);
      const indice = Array.from(
        fixture.nativeElement.querySelectorAll('app-resena-card') as NodeListOf<HTMLElement>,
      ).findIndex((card) => card.textContent?.includes('Muy buena atención'));
      confirmar(fixture, indice);

      expect(eliminar).toHaveBeenCalledWith(2, 'ADMIN');
      expect(fixture.nativeElement.textContent).toContain('La reseña se eliminó.');
    });

    it('debería mostrar el error si no se pudo eliminar', () => {
      autenticado.set(true);
      misResenaIds.set(new Set([1]));
      eliminar.mockReturnValue(throwError(() => new Error('403')));
      const fixture = crearComponente('5');
      mutationError.set('No podés modificar una reseña de otro usuario.');

      confirmar(fixture, 0);

      const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(alerta.textContent).toContain('No podés modificar una reseña de otro usuario.');
    });
  });

  describe('orden y filtros', () => {
    function comentarios(fixture: ReturnType<typeof crearComponente>) {
      return Array.from(
        fixture.nativeElement.querySelectorAll(
          'app-resena-card [data-testid="comentario"]',
        ) as NodeListOf<HTMLElement>,
      ).map((item) => item.textContent?.trim());
    }

    function ordenar(fixture: ReturnType<typeof crearComponente>, valor: string) {
      const select = fixture.nativeElement.querySelector('#orden-resenas') as HTMLSelectElement;
      select.value = valor;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }

    function filtro(fixture: ReturnType<typeof crearComponente>, estrellas: string) {
      return fixture.nativeElement.querySelector(
        `button[data-estrellas="${estrellas}"]`,
      ) as HTMLButtonElement;
    }

    it('debería mostrar primero las más recientes', () => {
      const fixture = crearComponente('5');

      expect(comentarios(fixture)).toEqual([
        'Muy buena atención y ambiente.',
        'La pasta estaba increíble.',
      ]);
    });

    it('debería reordenar por puntuación', () => {
      const fixture = crearComponente('5');

      ordenar(fixture, 'peores');
      expect(comentarios(fixture)[0]).toBe('Muy buena atención y ambiente.');

      ordenar(fixture, 'mejores');
      expect(comentarios(fixture)[0]).toBe('La pasta estaba increíble.');
    });

    it('debería filtrar por estrellas, marcar el filtro activo y anunciar el resultado', () => {
      const fixture = crearComponente('5');

      expect(filtro(fixture, '5').textContent).toContain('(1)');
      filtro(fixture, '5').click();
      fixture.detectChanges();

      expect(comentarios(fixture)).toEqual(['La pasta estaba increíble.']);
      expect(filtro(fixture, '5').getAttribute('aria-pressed')).toBe('true');
      expect(filtro(fixture, 'todas').getAttribute('aria-pressed')).toBe('false');
      expect(
        fixture.nativeElement.querySelector('[data-testid="resultado-filtro"]')?.textContent,
      ).toContain('Mostrando 1 de 2 reseñas');
    });

    it('debería explicar un filtro sin resultados y permitir volver a todas', () => {
      const fixture = crearComponente('5');

      filtro(fixture, '3').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No hay reseñas de 3 estrellas');

      const verTodas = Array.from(
        fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
      ).find((boton) => boton.textContent?.trim() === 'Ver todas');
      verTodas?.click();
      fixture.detectChanges();

      expect(comentarios(fixture).length).toBe(2);
    });
  });
});
