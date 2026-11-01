import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { APP_URL, BROWSER_LOCATION, DASHBOARD_URL, HOSTNAME } from '../config/host.config';
import { PortalNavigation } from './portal-navigation';
import { PORTALS } from './portals';

describe('PortalNavigation', () => {
  let assign: ReturnType<typeof vi.fn>;

  function crear(hostname: string) {
    assign = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: HOSTNAME, useValue: hostname },
        { provide: APP_URL, useValue: 'http://localhost:4200' },
        { provide: DASHBOARD_URL, useValue: 'http://dashboard.localhost:4200' },
        { provide: BROWSER_LOCATION, useValue: { assign } },
      ],
    });
    return TestBed.inject(PortalNavigation);
  }

  it('detecta en qué host se está sirviendo la app', () => {
    expect(crear('localhost').esDashboard()).toBe(false);
    expect(crear('dashboard.localhost').esDashboard()).toBe(true);
    expect(crear('dashboard.foodies.com').hostActual).toBe('dashboard');
  });

  it('construye la URL absoluta de un portal en el otro host', () => {
    const nav = crear('localhost');

    expect(nav.urlDe(PORTALS.ADMIN, '/admin/login', { email: 'ana@foodies.com' })).toBe(
      'http://dashboard.localhost:4200/admin/login?email=ana%40foodies.com',
    );
    expect(nav.urlDe(PORTALS.CLIENTE, '/login')).toBe('http://localhost:4200/login');
  });

  it('cruza de host cuando el portal vive en el otro subdominio', async () => {
    const nav = crear('localhost');

    await nav.irA('RESTAURANTE', '/restaurante/login', { email: 'pepe@foodies.com' });

    expect(assign).toHaveBeenCalledExactlyOnceWith(
      'http://dashboard.localhost:4200/restaurante/login?email=pepe%40foodies.com',
    );
  });

  it('navega in-app cuando el portal vive en el mismo host', async () => {
    const nav = crear('dashboard.localhost');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await nav.irA('ADMIN', '/admin', { returnUrl: '/admin/moderacion' });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(String(navigate.mock.calls[0][0] as UrlTree)).toBe(
      '/admin?returnUrl=%2Fadmin%2Fmoderacion',
    );
    expect(assign).not.toHaveBeenCalled();
  });
});
