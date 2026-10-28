import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { BAR_CHART_FACTORY } from '../../shared/charts/bar-chart-factory';
import { PIE_CHART_FACTORY } from '../../shared/charts/pie-chart-factory';
import { violacionesAxe } from '../../shared/testing/axe';
import { AdminLayout } from './layout/admin-layout';
import { MetricasAdmin } from './models/metricas-admin';
import { ResenaModeracion } from './models/resena-moderacion';
import { DashboardAdmin } from './pages/dashboard-admin/dashboard-admin';
import { ModeracionResenas } from './pages/moderacion-resenas/moderacion-resenas';
import { AdminMetricasService } from './services/admin-metricas.service';
import { AdminModeracionService } from './services/admin-moderacion.service';
import { AdminEntidadesService } from './services/admin-entidades.service';
import { AdminSolicitudesService } from './services/admin-solicitudes.service';
import { GestionEntidades } from './pages/gestion-entidades/gestion-entidades';
import { SolicitudesRestaurantes } from './pages/solicitudes-restaurantes/solicitudes-restaurantes';

@Component({ template: '<h1>Contenido</h1>' })
class PaginaFalsa {}

/** WCAG checks (axe-core) for the admin panel shell and pages. */
describe('Accesibilidad del panel de administración', () => {
  const metricas: MetricasAdmin = {
    periodo: '2026-10',
    topRestaurantesMejorCalificados: [
      { id: 5, nombre: 'Ochiwan', promedio: 4.5, cantidadResenas: 2 },
    ],
    topRestaurantesConMasReservas: [{ id: 5, nombre: 'Ochiwan', cantidadReservas: 7 }],
    topUsuariosConMasResenas: [{ id: 3, nombre: 'Ana', apellido: 'Gómez', cantidadResenas: 4 }],
    usuariosRegistradosEsteMes: 12,
  };
  const resenas: ResenaModeracion[] = [
    {
      id: 9,
      comentario: 'Muy rico todo',
      calificacion: 5,
      nombreUsuario: '',
      restauranteId: 5,
      nombreRestaurante: 'Ochiwan',
    },
  ];

  let datos: WritableSignal<MetricasAdmin | null>;
  let cargandoMetricas: WritableSignal<boolean>;
  let errorMetricas: WritableSignal<string | null>;
  let lista: WritableSignal<ResenaModeracion[]>;

  beforeEach(async () => {
    datos = signal<MetricasAdmin | null>(metricas);
    cargandoMetricas = signal(false);
    errorMetricas = signal<string | null>(null);
    lista = signal(resenas);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin',
            component: AdminLayout,
            children: [{ path: '', component: PaginaFalsa }],
          },
        ]),
        {
          provide: BAR_CHART_FACTORY,
          useValue: () => ({ data: { datasets: [] }, update: vi.fn(), destroy: vi.fn() }),
        },
        {
          provide: PIE_CHART_FACTORY,
          useValue: () => ({ data: { datasets: [] }, update: vi.fn(), destroy: vi.fn() }),
        },
        { provide: AuthService, useValue: { logout: vi.fn() } },
        {
          provide: AdminMetricasService,
          useValue: {
            metricas: datos.asReadonly(),
            cargando: cargandoMetricas.asReadonly(),
            error: errorMetricas.asReadonly(),
            cargar: vi.fn(() => of(metricas)),
          },
        },
        {
          provide: AdminModeracionService,
          useValue: {
            resenas: lista.asReadonly(),
            cargando: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            cargar: vi.fn(() => of(resenas)),
            eliminar: vi.fn(() => of(undefined)),
          },
        },
        {
          provide: AdminSolicitudesService,
          useValue: {
            solicitudes: signal([
              {
                restaurantId: 7,
                nombre: 'Pasta Nostra',
                ubicacion: 'Av. Colón 1200',
                especialidad: 'PASTAS',
                cupoMaximo: 40,
                estado: 'PENDIENTE',
                usuarioId: 12,
                email: 'pasta@mail.com',
                telefono: '2234000000',
                fechaRegistro: null,
              },
            ]).asReadonly(),
            cargando: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            cargar: vi.fn(() => of([])),
            aprobar: vi.fn(() => of(undefined)),
            rechazar: vi.fn(() => of(undefined)),
          },
        },
        {
          provide: AdminEntidadesService,
          useValue: {
            clientes: signal([
              {
                id: 4,
                nombre: 'Ana',
                apellido: 'Gómez',
                email: 'ana@mail.com',
                telefono: '2231111111',
                strikes: 1,
                activo: true,
                fechaRegistro: null,
              },
            ]).asReadonly(),
            restaurantes: signal([
              {
                id: 2,
                nombre: 'Ochiwan',
                ubicacion: 'San Juan 229',
                especialidad: 'ASIATICA',
                estado: 'APROBADO',
                strikes: 0,
                activo: false,
                usuarioId: 9,
                email: 'ochiwan@mail.com',
              },
            ]).asReadonly(),
            cargando: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            cargar: vi.fn(() => of(undefined)),
            cambiarActivoCliente: vi.fn(() => of(undefined)),
            cambiarActivoRestaurante: vi.fn(() => of(undefined)),
            aplicarStrike: vi.fn(() => of(undefined)),
          },
        },
      ],
    }).compileComponents();
  });

  async function sinViolaciones(fixture: ComponentFixture<unknown>) {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await violacionesAxe(fixture.nativeElement)).toEqual([]);
  }

  it('AdminLayout con el menú mobile cerrado y abierto', async () => {
    const harness = await RouterTestingHarness.create('/admin');
    const elemento = harness.routeNativeElement as HTMLElement;
    expect(await violacionesAxe(elemento)).toEqual([]);

    (elemento.querySelector('button[aria-controls="admin-sidebar"]') as HTMLButtonElement).click();
    harness.detectChanges();
    expect(await violacionesAxe(elemento)).toEqual([]);
  });

  it('DashboardAdmin con métricas: barras verticales, torta con leyenda y ranking vacío', async () => {
    datos.set({ ...metricas, topUsuariosConMasResenas: [] });
    await sinViolaciones(TestBed.createComponent(DashboardAdmin));
  });

  it('DashboardAdmin cargando y con error', async () => {
    datos.set(null);
    cargandoMetricas.set(true);
    const fixture = TestBed.createComponent(DashboardAdmin);
    await sinViolaciones(fixture);

    cargandoMetricas.set(false);
    errorMetricas.set('No se pudo conectar con el servidor.');
    await sinViolaciones(fixture);
  });

  it('ModeracionResenas con la tabla y con la confirmación abierta', async () => {
    const fixture = TestBed.createComponent(ModeracionResenas);
    await sinViolaciones(fixture);

    (fixture.nativeElement.querySelector('button[id="eliminar-9"]') as HTMLButtonElement).click();
    await sinViolaciones(fixture);
  });

  it('ModeracionResenas vacía', async () => {
    lista.set([]);
    await sinViolaciones(TestBed.createComponent(ModeracionResenas));
  });
  it('SolicitudesRestaurantes con una solicitud y con el rechazo por confirmar', async () => {
    const fixture = TestBed.createComponent(SolicitudesRestaurantes);
    await sinViolaciones(fixture);

    (fixture.nativeElement.querySelector('button[id="rechazar-7"]') as HTMLButtonElement).click();
    await sinViolaciones(fixture);
  });

  it('GestionEntidades en la pestaña de clientes y en la de restaurantes', async () => {
    const fixture = TestBed.createComponent(GestionEntidades);
    await sinViolaciones(fixture);

    (fixture.nativeElement.querySelector('#tab-restaurantes') as HTMLButtonElement).click();
    await sinViolaciones(fixture);
  });

  it('GestionEntidades con el modal de strike abierto y el error de motivo visible', async () => {
    const fixture = TestBed.createComponent(GestionEntidades);
    await sinViolaciones(fixture);

    (
      fixture.nativeElement.querySelector('[data-testid="aplicar-strike"]') as HTMLButtonElement
    ).click();
    await sinViolaciones(fixture);

    (
      fixture.nativeElement.querySelector('dialog button[type="submit"]') as HTMLButtonElement
    ).click();
    await sinViolaciones(fixture);
  });
});
