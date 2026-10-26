import { computed, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BAR_CHART_FACTORY } from '../../shared/charts/bar-chart-factory';
import { violacionesAxe } from '../../shared/testing/axe';
import { ToastService } from '../../shared/toast/toast.service';
import { ToastOutlet } from '../../shared/toast/toast-outlet';
import { RatingDistribution } from './components/rating-distribution/rating-distribution';
import { ResenaCard } from './components/resena-card/resena-card';
import { ResenaForm } from './components/resena-form/resena-form';
import { RestauranteResenas } from './components/restaurante-resenas/restaurante-resenas';
import { StarRating } from './components/star-rating/star-rating';
import { ResenaListDTO } from './models';
import { ResenaService } from './services/resena.service';

/** WCAG checks (axe-core) for every reviews component in the states users actually see. */
describe('Accesibilidad del módulo de reseñas', () => {
  const resenas: ResenaListDTO[] = [
    {
      id: 1,
      nombreUsuario: 'Ana Gómez',
      comentario: 'La pasta estaba increíble.',
      calificacion: 5,
    },
    { id: 2, nombreUsuario: '', comentario: 'Muy buena atención.', calificacion: 4 },
  ];

  let lista: WritableSignal<ResenaListDTO[]>;
  let cargando: WritableSignal<boolean>;
  let misIds: WritableSignal<ReadonlySet<number>>;

  beforeEach(async () => {
    lista = signal(resenas);
    cargando = signal(false);
    misIds = signal<ReadonlySet<number>>(new Set([1]));

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: BAR_CHART_FACTORY,
          useValue: () => ({ data: { datasets: [] }, update: vi.fn(), destroy: vi.fn() }),
        },
        {
          provide: ResenaService,
          useValue: {
            resenas: lista.asReadonly(),
            loading: cargando.asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            saving: signal(false).asReadonly(),
            mutationError: signal<string | null>(null).asReadonly(),
            totalResenas: computed(() => lista().length),
            promedioCalificacion: computed(() => 4.5),
            distribucionCalificaciones: computed(() =>
              [5, 4, 3, 2, 1].map((estrellas) => ({
                estrellas,
                cantidad: lista().filter((item) => item.calificacion === estrellas).length,
              })),
            ),
            misResenaIds: misIds.asReadonly(),
            listarPorRestaurante: vi.fn(() => of(resenas)),
            cargarMisResenas: vi.fn(() => of(new Set<number>())),
            crear: vi.fn(),
            actualizar: vi.fn(),
            eliminar: vi.fn(() => of(undefined)),
          },
        },
        {
          provide: AuthService,
          useValue: { isAuthenticated: (rol: string) => rol === 'CLIENTE', userId: () => 3 },
        },
      ],
    }).compileComponents();
  });

  async function sinViolaciones(fixture: ComponentFixture<unknown>) {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await violacionesAxe(fixture.nativeElement)).toEqual([]);
  }

  function botonConTexto(fixture: ComponentFixture<unknown>, texto: string) {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find(
      (boton) => boton.textContent?.trim() === texto || boton.ariaLabel === texto,
    );
  }

  it('StarRating en modo lectura', async () => {
    const fixture = TestBed.createComponent(StarRating);
    fixture.componentRef.setInput('value', 3.5);
    await sinViolaciones(fixture);
  });

  it('StarRating en modo interactivo', async () => {
    const fixture = TestBed.createComponent(StarRating);
    fixture.componentRef.setInput('value', 0);
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('label', 'Tu calificación');
    await sinViolaciones(fixture);
  });

  it('ResenaCard con acciones y con la confirmación de borrado abierta', async () => {
    const fixture = TestBed.createComponent(ResenaCard);
    fixture.componentRef.setInput('resena', resenas[0]);
    fixture.componentRef.setInput('editable', true);
    fixture.componentRef.setInput('eliminable', true);
    await sinViolaciones(fixture);

    botonConTexto(fixture, 'Eliminar reseña')?.click();
    await sinViolaciones(fixture);
  });

  it('ResenaForm vacío y con errores de validación', async () => {
    const fixture = TestBed.createComponent(ResenaForm);
    fixture.componentRef.setInput('restauranteId', 5);
    await sinViolaciones(fixture);

    await fixture.componentInstance.enviar(new Event('submit'));
    await sinViolaciones(fixture);
  });

  it('RatingDistribution', async () => {
    const fixture = TestBed.createComponent(RatingDistribution);
    fixture.componentRef.setInput('distribucion', [
      { estrellas: 5, cantidad: 1 },
      { estrellas: 4, cantidad: 1 },
      { estrellas: 3, cantidad: 0 },
      { estrellas: 2, cantidad: 0 },
      { estrellas: 1, cantidad: 0 },
    ]);
    await sinViolaciones(fixture);
  });

  it('RestauranteResenas con listado, filtros y orden', async () => {
    const fixture = TestBed.createComponent(RestauranteResenas);
    fixture.componentRef.setInput('restauranteId', 5);
    await sinViolaciones(fixture);
  });

  it('RestauranteResenas con un filtro sin resultados', async () => {
    const fixture = TestBed.createComponent(RestauranteResenas);
    fixture.componentRef.setInput('restauranteId', 5);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('button[data-estrellas="1"]') as HTMLButtonElement
    ).click();
    await sinViolaciones(fixture);
  });

  it('RestauranteResenas cargando y vacío', async () => {
    const fixture = TestBed.createComponent(RestauranteResenas);
    fixture.componentRef.setInput('restauranteId', 5);
    cargando.set(true);
    await sinViolaciones(fixture);

    cargando.set(false);
    lista.set([]);
    misIds.set(new Set());
    await sinViolaciones(fixture);
  });

  it('ToastOutlet con un éxito y un error', async () => {
    TestBed.overrideComponent(ToastOutlet, { add: { providers: [ToastService] } });
    const fixture = TestBed.createComponent(ToastOutlet);
    const toasts = fixture.debugElement.injector.get(ToastService);
    toasts.exito('Tu reseña se actualizó.');
    toasts.error('No se pudo eliminar la reseña.');
    await sinViolaciones(fixture);
  });
});
