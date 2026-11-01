import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BROWSER_LOCATION, DASHBOARD_URL } from '../config/host.config';
import { irAlDashboardGuard } from './ir-al-dashboard.guard';

describe('irAlDashboardGuard', () => {
  let assign: ReturnType<typeof vi.fn>;

  const run = (role: Parameters<typeof irAlDashboardGuard>[0], url: string) =>
    TestBed.runInInjectionContext(() => irAlDashboardGuard(role)(null as never, { url } as never));

  beforeEach(() => {
    assign = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BROWSER_LOCATION, useValue: { assign } },
        { provide: DASHBOARD_URL, useValue: 'http://dashboard.localhost:4200' },
      ],
    });
  });

  it('cruza al subdominio conservando la ruta pedida y cancela la navegación', () => {
    const result = run('ADMIN', '/admin/moderacion?page=2');

    expect(result).toBe(false);
    expect(assign).toHaveBeenCalledExactlyOnceWith(
      'http://dashboard.localhost:4200/admin/moderacion?page=2',
    );
  });

  it('usa el portal del restaurante para /restaurante/**', () => {
    const result = run('RESTAURANTE', '/restaurante/carta');

    expect(result).toBe(false);
    expect(assign).toHaveBeenCalledExactlyOnceWith(
      'http://dashboard.localhost:4200/restaurante/carta',
    );
  });
});
