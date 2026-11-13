import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Home } from './home/pages/home/home';
import { BROWSER_LOCATION, HOSTNAME } from './core/config/host.config';
import { APP_ROUTES, DASHBOARD_ROUTES, rutasParaHostname } from './app.routes';

describe('rutas por host', () => {
  it('sirve la app pública con su catálogo y portal de clientes', () => {
    const paths = APP_ROUTES.map((ruta) => ruta.path);

    expect(paths).toContain('restaurantes');
    expect(paths).toContain('mis-reservas');
    expect(paths).toContain('login');
    expect(paths).toContain('register');
  });

  it('cruza de origen para /restaurante/** y /admin/** desde la app pública', () => {
    for (const path of ['restaurante', 'admin']) {
      const ruta = APP_ROUTES.find((ruta) => ruta.path === path);

      expect(ruta?.canActivate?.length).toBe(1);
      expect(ruta?.loadChildren).toBeUndefined();
      expect(ruta?.children).toEqual([expect.objectContaining({ path: '**' })]);
    }
  });

  it('sirve solo los paneles en el host del dashboard', () => {
    const paths = DASHBOARD_ROUTES.map((ruta) => ruta.path);

    expect(paths).toContain('restaurante');
    expect(paths).toContain('restaurante/login');
    expect(paths).toContain('restaurante/register');
    expect(paths).toContain('admin');
    expect(paths).toContain('admin/login');
    expect(paths).not.toContain('mis-reservas');
  });

  it('arma un router válido para cada host', () => {
    for (const rutas of [APP_ROUTES, DASHBOARD_ROUTES]) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideRouter(rutas)] });

      expect(() => TestBed.inject(Router)).not.toThrow();
    }
  });

  it('muestra el home en la raíz de la app pública', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter(APP_ROUTES)] });
    const harness = await RouterTestingHarness.create('/');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(Home);
  });

  it('manda /restaurante/** de la app pública al dashboard', async () => {
    const assign = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(APP_ROUTES),
        { provide: HOSTNAME, useValue: 'localhost' },
        { provide: BROWSER_LOCATION, useValue: { assign } },
      ],
    });

    await TestBed.inject(Router).navigateByUrl('/restaurante/reservas?dia=hoy');

    expect(assign).toHaveBeenCalledWith(
      'http://dashboard.localhost:4200/restaurante/reservas?dia=hoy',
    );
  });

  it('elige el juego de rutas según el hostname', () => {
    expect(rutasParaHostname('localhost')).toBe(APP_ROUTES);
    expect(rutasParaHostname('dashboard.localhost')).toBe(DASHBOARD_ROUTES);
  });
});
