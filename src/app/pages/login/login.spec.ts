import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
    expect(element.querySelector('h1')?.textContent).toContain('Admin sign in');
    expect(element.textContent).not.toContain('Create one');
  });

  it('does not call the backend when the form is invalid', async () => {
    await submitForm();

    expect(element.textContent).toContain('Email is required.');
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
      'This account does not belong to this portal.',
    );
    expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
  });
});
