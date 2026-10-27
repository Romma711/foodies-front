import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { fakeJwt, futureExp } from '../../core/auth/testing';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const type = (selector: string, value: string) => {
    const input = element.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submitForm = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    fixture.componentRef.setInput('role', 'ADMIN');
    http = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('shows the portal title and hides register for admins', () => {
    expect(element.querySelector('h1')?.textContent).toContain('Iniciar sesión');
    expect(element.textContent).toContain('Portal Admin');
    expect(element.textContent).not.toContain('Creá una');
  });

  it('does not call the backend when the form is invalid', async () => {
    await submitForm();

    expect(element.textContent).toContain('El email es obligatorio.');
    http.expectNone(() => true);
  });

  it('shows an error when the account belongs to another portal', async () => {
    type('#login-email', 'ana@foodies.com');
    type('#login-password', 'secret123');
    await submitForm();

    http
      .expectOne(() => true)
      .flush({ Token: `Bearer ${fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() })}` });
    // Let the rejected login settle inside the async submit action before rendering.
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Esta cuenta no pertenece a este portal.',
    );
    expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
  });

  it('does not report a successful login as failed when navigation fails', async () => {
    // The test router has no `/admin` route, so the post-login navigation is rejected.
    type('#login-email', 'admin@foodies.com');
    type('#login-password', 'admin123');
    await submitForm();

    http
      .expectOne(() => true)
      .flush({ Token: `Bearer ${fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() })}` });
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(localStorage.getItem('foodies.token.ADMIN')).not.toBeNull();
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  describe('after a successful login', () => {
    const loginAsAdmin = async (returnUrl: string | undefined) => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      fixture.componentRef.setInput('returnUrl', returnUrl);
      type('#login-email', 'admin@foodies.com');
      type('#login-password', 'admin123');
      await submitForm();
      http
        .expectOne(() => true)
        .flush({ Token: `Bearer ${fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() })}` });
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
      return navigate;
    };

    it('returns to the page the guard sent the user away from', async () => {
      const navigate = await loginAsAdmin('/admin/resenas?page=2');

      expect(navigate).toHaveBeenCalledExactlyOnceWith('/admin/resenas?page=2');
    });

    it('opens the portal home without a return URL', async () => {
      const navigate = await loginAsAdmin(undefined);

      expect(navigate).toHaveBeenCalledExactlyOnceWith('/admin');
    });

    it('ignores a return URL that points outside the app', async () => {
      const navigate = await loginAsAdmin('https://evil.com');

      expect(navigate).toHaveBeenCalledExactlyOnceWith('/admin');
    });
  });
});
