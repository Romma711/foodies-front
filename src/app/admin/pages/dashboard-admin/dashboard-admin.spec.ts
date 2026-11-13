import { Component, input, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { RankingChart } from '../../components/ranking-chart/ranking-chart';
import { ItemRanking, MetricasAdmin } from '../../models/metricas-admin';
import { AdminMetricasService } from '../../services/admin-metricas.service';
import { DashboardAdmin } from './dashboard-admin';

@Component({ selector: 'app-ranking-chart', template: '' })
class RankingChartStub {
  readonly titulo = input('');
  readonly descripcion = input('');
  readonly tipo = input('horizontal');
  readonly items = input<readonly ItemRanking[]>([]);
  readonly unidad = input('');
  readonly maximo = input<number | null>(null);
  readonly color = input('');
}

describe('DashboardAdmin', () => {
  const metricas: MetricasAdmin = {
    periodo: '2026-10',
    topRestaurantesMejorCalificados: [
      { id: 5, nombre: 'Ochiwan', promedio: 4.5, cantidadResenas: 2 },
    ],
    topRestaurantesConMasReservas: [{ id: 3, nombre: 'La Casona', cantidadReservas: 7 }],
    topUsuariosConMasResenas: [{ id: 3, nombre: 'Ana', apellido: 'Gómez', cantidadResenas: 4 }],
    usuariosRegistradosEsteMes: 12,
  };

  let datos: WritableSignal<MetricasAdmin | null>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let cargar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    datos = signal<MetricasAdmin | null>(null);
    cargando = signal(false);
    error = signal<string | null>(null);
    cargar = vi.fn(() => of(metricas));

    TestBed.overrideComponent(DashboardAdmin, {
      remove: { imports: [RankingChart] },
      add: { imports: [RankingChartStub] },
    });
    await TestBed.configureTestingModule({
      imports: [DashboardAdmin],
      providers: [
        {
          provide: AdminMetricasService,
          useValue: {
            metricas: datos.asReadonly(),
            cargando: cargando.asReadonly(),
            error: error.asReadonly(),
            cargar,
          },
        },
      ],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(DashboardAdmin);
    fixture.detectChanges();
    return fixture;
  }

  function graficos(fixture: ReturnType<typeof crear>) {
    return fixture.debugElement
      .queryAll(By.directive(RankingChartStub))
      .map((item) => item.componentInstance as RankingChartStub);
  }

  it('debería pedir las métricas al entrar', () => {
    crear();

    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar skeletons mientras carga la primera vez', () => {
    cargando.set(true);
    const fixture = crear();
    const carga = fixture.nativeElement.querySelector('[data-testid="dashboard-cargando"]');

    expect(carga?.getAttribute('role')).toBe('status');
    expect(carga?.textContent).toContain('Cargando métricas…');
    expect(graficos(fixture).length).toBe(0);
  });

  it('debería mostrar el KPI del mes y los tres rankings', () => {
    datos.set(metricas);
    const fixture = crear();
    const elemento = fixture.nativeElement as HTMLElement;
    const [calificados, reservas, usuarios] = graficos(fixture);

    expect(elemento.querySelector('[data-testid="kpi-usuarios"]')?.textContent).toContain('12');
    expect(elemento.textContent).toContain('octubre de 2026');
    expect(calificados.titulo()).toBe('Restaurantes mejor calificados');
    expect(calificados.items()).toEqual([{ etiqueta: 'Ochiwan', valor: 4.5 }]);
    expect(calificados.maximo()).toBe(5);
    expect(calificados.tipo()).toBe('vertical');
    expect(reservas.tipo()).toBe('torta');
    expect(usuarios.tipo()).toBe('horizontal');
    expect(reservas.items()).toEqual([{ etiqueta: 'La Casona', valor: 7 }]);
    expect(usuarios.items()).toEqual([{ etiqueta: 'Ana Gómez', valor: 4 }]);
  });

  it('debería mostrar el error y permitir reintentar', () => {
    error.set('No se pudo conectar con el servidor.');
    const fixture = crear();
    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alerta.textContent).toContain('No se pudo conectar con el servidor.');
    (alerta.querySelector('button') as HTMLButtonElement).click();

    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it('debería mostrar Anónimo cuando el usuario no tiene nombre', () => {
    datos.set({
      ...metricas,
      topUsuariosConMasResenas: [
        { id: 9, nombre: null as unknown as string, apellido: '', cantidadResenas: 2 },
      ],
    });
    const fixture = crear();

    expect(graficos(fixture)[2].items()).toEqual([{ etiqueta: 'Anónimo', valor: 2 }]);
  });
});
