import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { fakeJwt, futureExp } from '../../core/auth/testing';
import { Header } from './header';

describe('Header', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    return fixture;
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('shows the sign in links without a session', async () => {
    const element = (await render()).nativeElement as HTMLElement;

    expect(element.textContent).toContain('Sign in');
    expect(element.textContent).toContain('For restaurants');
    expect(element.querySelector('button')).toBeNull();
  });

  it('lists every active session with its own sign out', async () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() }),
    );
    const element = (await render()).nativeElement as HTMLElement;

    const buttons = [...element.querySelectorAll('button')].map((b) =>
      b.getAttribute('aria-label'),
    );
    expect(buttons).toEqual(['Sign out of Admin', 'Sign out of Customer']);
    expect(element.textContent).not.toContain('For restaurants');
  });

  it('signs out only the chosen role and opens its login', async () => {
    localStorage.setItem(
      'foodies.token.CLIENTE',
      fakeJwt({ roles: ['ROLE_CLIENTE'], exp: futureExp() }),
    );
    localStorage.setItem(
      'foodies.token.ADMIN',
      fakeJwt({ roles: ['ROLE_ADMIN'], exp: futureExp() }),
    );
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    [...element.querySelectorAll('button')]
      .find((b) => b.getAttribute('aria-label') === 'Sign out of Customer')!
      .click();
    await fixture.whenStable();

    expect(localStorage.getItem('foodies.token.CLIENTE')).toBeNull();
    expect(localStorage.getItem('foodies.token.ADMIN')).not.toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(element.querySelectorAll('button')).toHaveLength(1);
  });
});
