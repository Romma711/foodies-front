import { TestBed } from '@angular/core/testing';
import { ChartConfiguration } from 'chart.js';
import { DistribucionCalificacion } from '../../models';
import { BAR_CHART_FACTORY, BarChart } from '../../../../shared/charts/bar-chart-factory';
import { RatingDistribution } from './rating-distribution';

describe('RatingDistribution', () => {
  const distribucion: DistribucionCalificacion[] = [
    { estrellas: 5, cantidad: 3 },
    { estrellas: 4, cantidad: 1 },
    { estrellas: 3, cantidad: 0 },
    { estrellas: 2, cantidad: 0 },
    { estrellas: 1, cantidad: 1 },
  ];

  let grafico: BarChart;
  let update: ReturnType<typeof vi.fn<() => void>>;
  let destroy: ReturnType<typeof vi.fn<() => void>>;
  let crearGrafico: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    crearGrafico = vi.fn((_canvas: HTMLCanvasElement, config: ChartConfiguration<'bar'>) => {
      update = vi.fn<() => void>();
      destroy = vi.fn<() => void>();
      grafico = { data: config.data, update, destroy };
      return grafico;
    });

    await TestBed.configureTestingModule({
      imports: [RatingDistribution],
      providers: [{ provide: BAR_CHART_FACTORY, useValue: crearGrafico }],
    }).compileComponents();
  });

  function crear(datos: DistribucionCalificacion[]) {
    const fixture = TestBed.createComponent(RatingDistribution);
    fixture.componentRef.setInput('distribucion', datos);
    fixture.detectChanges();
    return fixture;
  }

  it('debería crear un gráfico de barras con una barra por estrella', () => {
    const fixture = crear(distribucion);
    const [canvas, config] = crearGrafico.mock.calls[0] as [
      HTMLCanvasElement,
      ChartConfiguration<'bar'>,
    ];

    expect(crearGrafico).toHaveBeenCalledTimes(1);
    expect(canvas).toBe(fixture.nativeElement.querySelector('canvas'));
    expect(config.type).toBe('bar');
    expect(config.data.labels).toEqual(['5 ★', '4 ★', '3 ★', '2 ★', '1 ★']);
    expect(config.data.datasets[0].data).toEqual([3, 1, 0, 0, 1]);
  });

  it('debería actualizar el gráfico existente cuando cambian los datos', () => {
    const fixture = crear(distribucion);

    fixture.componentRef.setInput('distribucion', [
      { estrellas: 5, cantidad: 4 },
      ...distribucion.slice(1),
    ]);
    fixture.detectChanges();

    expect(crearGrafico).toHaveBeenCalledTimes(1);
    expect(grafico.data.datasets[0].data).toEqual([4, 1, 0, 0, 1]);
    expect(update).toHaveBeenCalled();
  });

  it('debería destruir el gráfico al destruir el componente', () => {
    const fixture = crear(distribucion);

    fixture.destroy();

    expect(destroy).toHaveBeenCalled();
  });

  it('debería ocultar el canvas a lectores de pantalla y exponer los datos en una tabla', () => {
    const fixture = crear(distribucion);
    const elemento = fixture.nativeElement as HTMLElement;
    const filas = Array.from(elemento.querySelectorAll('tbody tr')).map((fila) =>
      Array.from(fila.querySelectorAll('th, td'))
        .map((celda) => celda.textContent?.trim())
        .join(' | '),
    );

    expect(elemento.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(filas[0]).toBe('5 estrellas | 3 reseñas');
    expect(filas[1]).toBe('4 estrellas | 1 reseña');
    expect(filas).toHaveLength(5);
  });
});
