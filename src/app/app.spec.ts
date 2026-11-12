import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HOSTNAME } from './core/config/host.config';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the header, the router outlet and the footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-header header')).not.toBeNull();
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('app-footer footer')).not.toBeNull();
  });

  it('offers a skip link that moves focus to the main content', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);

    const skip = element.querySelector('a') as HTMLAnchorElement;
    expect(skip.textContent?.trim()).toBe('Saltar al contenido');
    skip.click();

    expect(document.activeElement?.id).toBe('contenido');
    element.remove();
  });

  it('hides the public header and footer on the dashboard host', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: HOSTNAME, useValue: 'dashboard.localhost' },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-header')).toBeNull();
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('app-footer')).toBeNull();
  });
});
