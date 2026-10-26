import { TestBed } from '@angular/core/testing';
import { ChartConfiguration } from 'chart.js';
import { BAR_CHART_FACTORY, BarChart } from '../../../../shared/charts/bar-chart-factory';
import { ItemRanking } from '../../models/metricas-admin';
import { RankingChart } from './ranking-chart';

describe('RankingChart', () => {
  const items: ItemRanking[] = [
    { etiqueta: 'Ochiwan', valor: 4.5 },
    { etiqueta: 'La Casona', valor: 3 },
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
      imports: [RankingChart],
      providers: [{ provide: BAR_CHART_FACTORY, useValue: crearGrafico }],
    }).compileComponents();
  });

  function crear(datos: ItemRanking[], unidad = 'reseñas', maximo: number | null = null) {
    const fixture = TestBed.createComponent(RankingChart);
    fixture.componentRef.setInput('titulo', 'Mejor calificados');
    fixture.componentRef.setInput('items', datos);
    fixture.componentRef.setInput('unidad', unidad);
    fixture.componentRef.setInput('maximo', maximo);
    fixture.detectChanges();
    return fixture;
  }

  it('debería graficar una barra por item con el máximo indicado', () => {
    crear(items, 'de 5', 5);
    const config = crearGrafico.mock.calls[0][1] as ChartConfiguration<'bar'>;

    expect(config.data.labels).toEqual(['Ochiwan', 'La Casona']);
    expect(config.data.datasets[0].data).toEqual([4.5, 3]);
    expect(config.options?.scales?.['x']?.max).toBe(5);
  });

  it('debería mostrar la descripción de qué mide el ranking', () => {
    const fixture = TestBed.createComponent(RankingChart);
    fixture.componentRef.setInput('titulo', 'Mejor calificados');
    fixture.componentRef.setInput('descripcion', 'Promedio de calificación de 1 a 5.');
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    const descripcion = fixture.nativeElement.querySelector('[data-testid="descripcion"]');
    expect(descripcion?.textContent?.trim()).toBe('Promedio de calificación de 1 a 5.');
  });

  it('debería escribir el valor con su unidad al final de cada barra', () => {
    crear(items, 'de 5', 5);
    const config = crearGrafico.mock.calls[0][1] as ChartConfiguration<'bar'>;
    const plugin = config.plugins?.find((p) => p.id === 'valores');
    const textos: [string, number, number][] = [];
    const chart = {
      ctx: {
        save: vi.fn(),
        restore: vi.fn(),
        fillText: (texto: string, x: number, y: number) => textos.push([texto, x, y]),
      },
      chartArea: { right: 200 },
      data: config.data,
      getDatasetMeta: () => ({ data: [{ y: 10 }, { y: 50 }] }),
    };

    plugin?.afterDatasetsDraw?.(chart as never, {} as never, {} as never, false);

    expect(textos.map(([texto]) => texto)).toEqual(['4.5 de 5', '3 de 5']);
    expect(textos.every(([, x]) => x > 200)).toBe(true);
    expect(config.options?.layout?.padding).toEqual({ right: expect.any(Number) });
  });

  it('debería actualizar el gráfico existente cuando cambian los items', () => {
    const fixture = crear(items);

    fixture.componentRef.setInput('items', [{ etiqueta: 'Nuevo', valor: 9 }]);
    fixture.detectChanges();

    expect(crearGrafico).toHaveBeenCalledTimes(1);
    expect(grafico.data.labels).toEqual(['Nuevo']);
    expect(update).toHaveBeenCalled();
  });

  it('debería exponer los datos en una tabla accesible y ocultar el canvas', () => {
    const fixture = crear(items, 'puntos');
    const elemento = fixture.nativeElement as HTMLElement;
    const filas = Array.from(elemento.querySelectorAll('tbody tr')).map((fila) =>
      Array.from(fila.querySelectorAll('th, td'))
        .map((celda) => celda.textContent?.trim())
        .join(' | '),
    );

    expect(elemento.querySelector('h2')?.textContent).toContain('Mejor calificados');
    expect(elemento.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(filas).toEqual(['Ochiwan | 4.5 puntos', 'La Casona | 3 puntos']);
  });

  it('debería mostrar un estado vacío sin crear el gráfico', () => {
    const fixture = crear([]);

    expect(crearGrafico).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay datos');
  });

  it('debería destruir el gráfico al destruirse', () => {
    const fixture = crear(items);

    fixture.destroy();

    expect(destroy).toHaveBeenCalled();
  });
});
