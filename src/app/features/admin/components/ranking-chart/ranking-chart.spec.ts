import { TestBed } from '@angular/core/testing';
import { ChartConfiguration } from 'chart.js';
import { BAR_CHART_FACTORY, BarChart } from '../../../../shared/charts/bar-chart-factory';
import { PIE_CHART_FACTORY } from '../../../../shared/charts/pie-chart-factory';
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
  let crearTorta: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    crearGrafico = vi.fn((_canvas: HTMLCanvasElement, config: ChartConfiguration<'bar'>) => {
      update = vi.fn<() => void>();
      destroy = vi.fn<() => void>();
      grafico = { data: config.data, update, destroy };
      return grafico;
    });
    crearTorta = vi.fn((_canvas: HTMLCanvasElement, config: ChartConfiguration<'pie'>) => ({
      data: config.data,
      update: vi.fn(),
      destroy: vi.fn(),
    }));

    await TestBed.configureTestingModule({
      imports: [RankingChart],
      providers: [
        { provide: BAR_CHART_FACTORY, useValue: crearGrafico },
        { provide: PIE_CHART_FACTORY, useValue: crearTorta },
      ],
    }).compileComponents();
  });

  function crear(
    datos: ItemRanking[],
    unidad = 'reseñas',
    maximo: number | null = null,
    tipo: 'horizontal' | 'vertical' | 'torta' = 'horizontal',
  ) {
    const fixture = TestBed.createComponent(RankingChart);
    fixture.componentRef.setInput('tipo', tipo);
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

  it('debería graficar barras verticales con el valor arriba de cada columna', () => {
    crear(items, 'de 5', 5, 'vertical');
    const config = crearGrafico.mock.calls[0][1] as ChartConfiguration<'bar'>;
    const plugin = config.plugins?.find((p) => p.id === 'valores');
    const textos: [string, number, number][] = [];
    const chart = {
      ctx: {
        save: vi.fn(),
        restore: vi.fn(),
        fillText: (texto: string, x: number, y: number) => textos.push([texto, x, y]),
      },
      chartArea: { right: 200, top: 20 },
      data: config.data,
      getDatasetMeta: () => ({
        data: [
          { x: 40, y: 60 },
          { x: 120, y: 90 },
        ],
      }),
    };

    plugin?.afterDatasetsDraw?.(chart as never, {} as never, {} as never, false);

    expect(config.options?.indexAxis).toBe('x');
    expect(config.options?.scales?.['y']?.max).toBe(5);
    expect(textos.map(([texto]) => texto)).toEqual(['4.5 de 5', '3 de 5']);
    expect(textos.map(([, x]) => x)).toEqual([40, 120]);
    // Each value sits above its own column top (y 60 and 90).
    expect(textos[0][2]).toBeLessThan(60);
    expect(textos[1][2]).toBeLessThan(90);
  });

  it('debería partir los nombres largos en dos líneas bajo las columnas verticales', () => {
    crear([{ etiqueta: 'La Parrilla de Tito y Familia', valor: 4 }], 'de 5', 5, 'vertical');
    const config = crearGrafico.mock.calls[0][1] as ChartConfiguration<'bar'>;
    const callback = config.options?.scales?.['x']?.ticks?.callback as (
      this: { getLabelForValue(valor: number): string },
      valor: number,
    ) => string[];

    const lineas = callback.call({ getLabelForValue: () => 'La Parrilla de Tito y Familia' }, 0);

    expect(lineas).toEqual(['La Parrilla', 'de Tito y…']);
  });

  it('debería graficar una torta con su leyenda, valores y porcentajes', () => {
    const fixture = crear(
      [
        { etiqueta: 'Ochiwan', valor: 6 },
        { etiqueta: 'La Casona', valor: 2 },
      ],
      'reservas',
      null,
      'torta',
    );
    const config = crearTorta.mock.calls[0][1] as ChartConfiguration<'pie'>;
    const leyenda = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="leyenda"] li'),
    ).map((item) => item.textContent?.replace(/\s+/g, ' ').trim());

    expect(crearGrafico).not.toHaveBeenCalled();
    expect(config.type).toBe('pie');
    expect(config.data.labels).toEqual(['Ochiwan', 'La Casona']);
    expect(config.data.datasets[0].data).toEqual([6, 2]);
    expect((config.data.datasets[0].backgroundColor as string[]).length).toBe(2);
    expect(leyenda).toEqual(['Ochiwan 6 reservas · 75%', 'La Casona 2 reservas · 25%']);
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
