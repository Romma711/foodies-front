import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { ReservaPanel } from '../panel.models';
import { daysFromToday, providePanelTesting, reserva, settle } from '../panel.testing';
import { Reservas } from './reservas';

describe('Reservas', () => {
  let fixture: ComponentFixture<Reservas>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const render = async (reservas: ReservaPanel[]) => {
    fixture = TestBed.createComponent(Reservas);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me/reservas').flush(reservas);
    await settle(fixture);
  };

  const names = () => [...element.querySelectorAll('.name')].map((n) => n.textContent?.trim());
  const filter = (label: string) =>
    [...element.querySelectorAll<HTMLButtonElement>('.filter')].find((b) =>
      b.textContent?.includes(label),
    )!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reservas],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('shows upcoming pending reservations first, grouped by day and ordered by time', async () => {
    await render([
      reserva({ id: 1, nombreCliente: 'Late', horarioLlegada: '22:00:00' }),
      reserva({ id: 2, nombreCliente: 'Early', horarioLlegada: '19:00:00' }),
      reserva({ id: 3, nombreCliente: 'Accepted', estado: 'ACEPTADA' }),
      reserva({ id: 4, nombreCliente: 'Past', fecha: daysFromToday(-2) }),
    ]);

    expect(names()).toEqual(['Early', 'Late']);
    expect(filter('Pendientes').getAttribute('aria-pressed')).toBe('true');
    expect(filter('Pendientes').textContent).toContain('2');
    expect(element.querySelectorAll('section.day')).toHaveLength(1);
  });

  it('filters by status and can include past reservations', async () => {
    await render([
      reserva({ id: 1, nombreCliente: 'Pending' }),
      reserva({ id: 3, nombreCliente: 'Accepted', estado: 'ACEPTADA' }),
      reserva({ id: 4, nombreCliente: 'Past', fecha: daysFromToday(-2) }),
    ]);

    filter('Aceptadas').click();
    await fixture.whenStable();
    expect(names()).toEqual(['Accepted']);

    filter('Todas').click();
    const toggle = element.querySelector<HTMLInputElement>('.toggle input')!;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(names()).toEqual(['Past', 'Pending', 'Accepted']);
  });

  it('shows the status as text, not only as a color', async () => {
    await render([reserva({ estado: 'PENDIENTE' })]);

    expect(element.querySelector('.badge')?.textContent?.trim()).toBe('Pendiente');
  });

  it('accepts a reservation after confirmation and updates it in place', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
    await render([reserva({ id: 9, nombreCliente: 'Ana Pérez' })]);

    element
      .querySelector<HTMLButtonElement>('[aria-label^="Aceptar la reserva de Ana Pérez"]')!
      .click();
    await settle(fixture);
    const req = http.expectOne({ method: 'PATCH', url: '/api/reservas/9/estado' });
    expect(req.request.body).toEqual({ estado: 'ACEPTADA' });
    req.flush(reserva({ id: 9, nombreCliente: 'Ana Pérez', estado: 'ACEPTADA' }));
    await settle(fixture);

    expect(element.querySelector('[role="status"]')?.textContent).toContain('aceptada');
    filter('Aceptadas').click();
    await fixture.whenStable();
    expect(element.querySelector('.badge')?.textContent?.trim()).toBe('Aceptada');
  });

  it('does not cancel when the manager goes back', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(false);
    await render([reserva({ id: 9 })]);

    element.querySelector<HTMLButtonElement>('[aria-label^="Cancelar la reserva"]')!.click();
    await settle(fixture);

    http.expectNone({ method: 'PATCH' });
  });

  it('muestra la fecha de cada día en español', async () => {
    await render([reserva({ id: 1 })]);

    expect(element.querySelector('section.day h2')?.textContent).toMatch(
      /^\s*[A-ZÁÉ][a-záéíóú]+, \d{1,2} de [a-z]+ de \d{4}/,
    );
  });

  it('shows an empty state', async () => {
    await render([]);

    expect(element.textContent).toContain('No hay reservas esperando tu respuesta.');
  });
});
