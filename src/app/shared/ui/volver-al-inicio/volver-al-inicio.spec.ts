import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HOSTNAME } from '../../../core/config/host.config';
import { VolverAlInicio } from './volver-al-inicio';

describe('VolverAlInicio', () => {
  function render(hostname: string): HTMLAnchorElement {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: HOSTNAME, useValue: hostname }],
    });
    const fixture = TestBed.createComponent(VolverAlInicio);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('a')!;
  }

  it('navigates in-app to the home on the public app', () => {
    const link = render('localhost');

    expect(link.getAttribute('href')).toBe('/');
    expect(link.textContent?.trim()).toBe('Volver al inicio');
  });

  it('leaves the dashboard for the public app home', () => {
    const link = render('dashboard.localhost');

    expect(link.getAttribute('href')).toBe('http://localhost:4200/');
    expect(link.textContent?.trim()).toBe('Volver al inicio');
  });
});
