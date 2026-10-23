import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { PartialMatchRouteSnapshot, provideRouter, Route, UrlSegment } from '@angular/router';
import { guestGuard } from './guest.guard';
import { fakeJwt, futureExp } from './testing';

describe('guestGuard', () => {
  const run = (route: Route) =>
    TestBed.runInInjectionContext(() =>
      guestGuard(route, [] as UrlSegment[], {} as PartialMatchRouteSnapshot),
    );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  it('lets guests open the login page', () => {
    expect(run({ data: { role: 'ADMIN' } })).toBe(true);
  });

  it('sends a signed in user to the home of that portal', () => {
    localStorage.setItem(
      'foodies.token.RESTAURANTE',
      fakeJwt({ roles: ['ROLE_ENCARGADO'], exp: futureExp() }),
    );

    expect(String(run({ data: { role: 'RESTAURANTE' } }))).toBe('/restaurante');
  });

  it('ignores sessions of other roles', () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );

    expect(run({ data: { role: 'ADMIN' } })).toBe(true);
  });

  it('lets routes without a role through', () => {
    expect(run({})).toBe(true);
  });
});
