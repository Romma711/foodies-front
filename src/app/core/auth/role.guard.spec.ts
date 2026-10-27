import { provideHttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  PartialMatchRouteSnapshot,
  provideRouter,
  Route,
  Router,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { roleGuard } from './role.guard';
import { fakeJwt, futureExp } from './testing';

describe('roleGuard', () => {
  const run = (role: Parameters<typeof roleGuard>[0]) =>
    TestBed.runInInjectionContext(() =>
      roleGuard(role)({} as Route, [] as UrlSegment[], {} as PartialMatchRouteSnapshot),
    );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  it('matches with a valid session for the role', () => {
    localStorage.setItem('foodies.token.ADMIN', fakeJwt({ role: 'ADMIN', exp: futureExp() }));

    expect(run('ADMIN')).toBe(true);
  });

  it('redirects to the role login without a session', () => {
    localStorage.setItem('foodies.token.CLIENTE', fakeJwt({ role: 'CLIENTE', exp: futureExp() }));

    const result = run('ADMIN');

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/admin/login');
  });

  it('redirects when the session expired', () => {
    localStorage.setItem('foodies.token.RESTAURANTE', fakeJwt({ role: 'RESTAURANTE', exp: 1 }));

    expect(String(run('RESTAURANTE'))).toBe('/restaurante/login');
  });

  it('remembers the requested URL so the login can return to it', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: 'mis-reservas', canMatch: [roleGuard('CLIENTE')], component: Blank },
          { path: 'login', component: Blank },
        ]),
      ],
    });
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/mis-reservas?page=2');

    expect(router.url).toBe('/login?returnUrl=%2Fmis-reservas%3Fpage%3D2');
  });
});

@Component({ template: '' })
class Blank {}
