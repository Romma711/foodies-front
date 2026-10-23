import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  daysFromToday,
  miRestaurante,
  providePanelTesting,
  reserva,
  settle,
} from '../panel.testing';
import { Resumen } from './resumen';

describe('Resumen', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resumen],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('summarizes pending reservations, today and the menu status', async () => {
    const fixture = TestBed.createComponent(Resumen);
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me').flush(miRestaurante());
    http
      .expectOne('/api/restaurantes/me/reservas')
      .flush([
        reserva({ id: 1, fecha: daysFromToday(0), cantidad: 4, estado: 'ACEPTADA' }),
        reserva({ id: 2, fecha: daysFromToday(0), cantidad: 2, estado: 'PENDIENTE' }),
        reserva({ id: 3, fecha: daysFromToday(0), cantidad: 9, estado: 'CANCELADA' }),
        reserva({ id: 4, fecha: daysFromToday(2), estado: 'PENDIENTE' }),
        reserva({ id: 5, fecha: daysFromToday(-1), estado: 'PENDIENTE' }),
      ]);
    await settle(fixture);
    const values = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.stat-value')].map(
      (v) => v.textContent?.trim(),
    );

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toBe(
      'La Parrilla',
    );
    expect(values).toEqual(['2', '2', 'Missing']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('6 people');
  });

  it('offers a retry when loading fails', async () => {
    const fixture = TestBed.createComponent(Resumen);
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me').flush(null, { status: 500, statusText: 'Error' });
    // forkJoin cancels the sibling request once one fails.
    expect(http.expectOne('/api/restaurantes/me/reservas').cancelled).toBe(true);
    await settle(fixture);
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Could not load');
    element.querySelector('button')!.click();
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me').flush(miRestaurante());
    http.expectOne('/api/restaurantes/me/reservas').flush([]);
    await settle(fixture);
    expect(element.querySelector('h1')?.textContent).toBe('La Parrilla');
  });
});
