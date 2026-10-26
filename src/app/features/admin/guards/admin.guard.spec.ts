import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  PartialMatchRouteSnapshot,
  provideRouter,
  Route,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { fakeJwt, futureExp } from '../../../core/auth/testing';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  const run = () =>
    TestBed.runInInjectionContext(() =>
      adminGuard({} as Route, [] as UrlSegment[], {} as PartialMatchRouteSnapshot),
    );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });

  it('deja pasar un JWT vigente con rol ADMIN', () => {
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() }),
    );

    expect(run()).toBe(true);
  });

  it('redirige al login de admin sin sesión', () => {
    const result = run();

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/admin/login');
  });

  it('redirige y limpia la sesión si el JWT venció', () => {
    localStorage.setItem('foodies.token.ADMIN', fakeJwt({ roles: ['ROLE_ADMIN'], exp: 1 }));

    expect(String(run())).toBe('/admin/login');
    expect(localStorage.getItem('foodies.token.ADMIN')).toBeNull();
  });

  it('rechaza un token guardado como admin cuyo claim no es ADMIN', () => {
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );

    expect(String(run())).toBe('/admin/login');
    expect(localStorage.getItem('foodies.token.ADMIN')).toBeNull();
  });

  it('no acepta la sesión de un cliente para entrar al panel', () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );

    expect(String(run())).toBe('/admin/login');
    expect(localStorage.getItem('foodies.token.CLIENTE')).not.toBeNull();
  });
});
