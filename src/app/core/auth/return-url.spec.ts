import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('keeps in-app paths with their query string', () => {
    expect(safeReturnUrl('/mis-reservas')).toBe('/mis-reservas');
    expect(safeReturnUrl('/admin/resenas?page=2')).toBe('/admin/resenas?page=2');
  });

  it('rejects anything that could leave the app', () => {
    expect(safeReturnUrl('https://evil.com')).toBeNull();
    expect(safeReturnUrl('//evil.com')).toBeNull();
    expect(safeReturnUrl('/\\evil.com')).toBeNull();
    expect(safeReturnUrl('javascript:alert(1)')).toBeNull();
    expect(safeReturnUrl('mis-reservas')).toBeNull();
    expect(safeReturnUrl(' /mis-reservas')).toBeNull();
  });

  it('keeps tricky paths inside the app once the router serializes them', () => {
    const router = TestBed.inject(Router);
    const tricky = [
      '/\t/evil.com',
      '/\n/evil.com',
      '/%2F%2Fevil.com',
      '/%5Cevil.com',
      '/..//evil.com',
    ];

    for (const url of tricky) {
      const accepted = safeReturnUrl(url);
      const resolved = new URL(router.serializeUrl(router.parseUrl(accepted!)), 'https://app.test');

      expect(resolved.origin).toBe('https://app.test');
    }
  });

  it('ignores missing values and the app root', () => {
    expect(safeReturnUrl(undefined)).toBeNull();
    expect(safeReturnUrl(null)).toBeNull();
    expect(safeReturnUrl('')).toBeNull();
    expect(safeReturnUrl('/')).toBeNull();
  });
});
