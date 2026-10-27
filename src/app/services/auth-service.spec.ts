import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Auth } from './auth-service';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debería iniciar sin sesión', () => {
    expect(service.estaAutenticado()).toBe(false);
    expect(service.email()).toBeNull();
    expect(service.usuarioId()).toBeNull();
  });
});
