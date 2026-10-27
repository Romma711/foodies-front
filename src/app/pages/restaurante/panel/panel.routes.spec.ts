import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { RESTAURANTE_TOKEN } from './panel.testing';

describe('restaurant panel routes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
  });

  it('keeps the restaurant login reachable for guests', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/restaurante/login');

    expect(TestBed.inject(Router).url).toBe('/restaurante/login');
  });

  it('sends guests from a panel section to the restaurant login', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/restaurante/reservas');

    expect(TestBed.inject(Router).url).toBe('/restaurante/login');
  });

  it('opens panel sections for a signed in manager', async () => {
    localStorage.setItem('foodies.token.RESTAURANTE', RESTAURANTE_TOKEN);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/restaurante/carta');

    expect(TestBed.inject(Router).url).toBe('/restaurante/carta');
    expect(
      harness.routeNativeElement?.querySelector('nav[aria-label="Restaurant panel"]'),
    ).not.toBeNull();
    expect(
      harness.routeNativeElement?.querySelector('a[aria-current="page"]')?.textContent?.trim(),
    ).toBe('Menu');
  });
});
