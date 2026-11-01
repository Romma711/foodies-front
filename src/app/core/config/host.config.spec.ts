import { esDashboardHost } from './host.config';

describe('esDashboardHost', () => {
  it('reconoce el subdominio del dashboard', () => {
    expect(esDashboardHost('dashboard.localhost')).toBe(true);
    expect(esDashboardHost('dashboard.foodies.com')).toBe(true);
  });

  it('la app pública no es el dashboard', () => {
    expect(esDashboardHost('localhost')).toBe(false);
    expect(esDashboardHost('foodies.com')).toBe(false);
  });
});
