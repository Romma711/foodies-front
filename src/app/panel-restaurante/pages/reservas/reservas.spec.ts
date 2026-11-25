import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { ReservaPanel } from '../../models/panel.models';
import { daysFromToday, providePanelTesting, reserva, settle } from '../../testing/panel.testing';
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

  it('muestra en qué espacio es cada reserva', async () => {
    await render([reserva({ espacioNombre: 'Patio trasero' })]);

    expect(element.querySelector('.espacio')?.textContent?.trim()).toBe('Patio trasero');
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

  describe('rechazo y asistencia (reglas D4 y D21)', () => {
    /** Local `yyyy-MM-dd` and `HH:mm:ss` of `minutos` from now. */
    const dentroDe = (minutos: number) => {
      const m = new Date(Date.now() + minutos * 60_000);
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        fecha: `${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(m.getDate())}`,
        horarioLlegada: `${pad(m.getHours())}:${pad(m.getMinutes())}:00`,
      };
    };
    const acciones = (id: number) =>
      [...element.querySelectorAll<HTMLButtonElement>(`li [data-accion]`)]
        .filter((b) => b.closest('li')?.querySelector('.name')?.textContent?.includes(`#${id}`))
        .map((b) => b.textContent?.trim());

    it('ofrece aceptar, rechazar y cancelar una pendiente; solo cancelar una aceptada', async () => {
      await render([
        reserva({ id: 1, nombreCliente: '#1', ...dentroDe(120) }),
        reserva({ id: 2, nombreCliente: '#2', estado: 'ACEPTADA', ...dentroDe(120) }),
      ]);
      filter('Todas').click();
      await fixture.whenStable();

      expect(acciones(1)).toEqual(['Aceptar', 'Rechazar', 'Cancelar']);
      expect(acciones(2)).toEqual(['Cancelar']);
    });

    it('desde la llegada y hasta 48 h ofrece asistió / no asistió, aunque sea de ayer', async () => {
      await render([
        reserva({ id: 3, nombreCliente: '#3', estado: 'ACEPTADA', ...dentroDe(-30) }),
        reserva({ id: 4, nombreCliente: '#4', estado: 'ACEPTADA', ...dentroDe(-26 * 60) }),
        reserva({ id: 5, nombreCliente: '#5', estado: 'ACEPTADA', ...dentroDe(-49 * 60) }),
      ]);
      filter('Todas').click();
      await fixture.whenStable();

      expect(acciones(3)).toEqual(['Asistió', 'No asistió']);
      expect(acciones(4)).toEqual(['Asistió', 'No asistió']);
      expect(names()).not.toContain('#5');
    });

    it('el filtro "Asistencia pendiente" muestra solo las que falta marcar (S7f)', async () => {
      await render([
        reserva({ id: 1, nombreCliente: '#1', ...dentroDe(120) }),
        reserva({ id: 2, nombreCliente: '#2', estado: 'ACEPTADA', ...dentroDe(120) }),
        reserva({ id: 3, nombreCliente: '#3', estado: 'ACEPTADA', ...dentroDe(-30) }),
        reserva({ id: 4, nombreCliente: '#4', estado: 'ACEPTADA', ...dentroDe(-26 * 60) }),
        reserva({ id: 5, nombreCliente: '#5', estado: 'ACEPTADA', ...dentroDe(-49 * 60) }),
        reserva({ id: 6, nombreCliente: '#6', ...dentroDe(-30) }),
        reserva({ id: 7, nombreCliente: '#7', estado: 'ASISTIO', ...dentroDe(-30) }),
      ]);

      expect(filter('Asistencia pendiente').textContent).toContain('2');
      filter('Asistencia pendiente').click();
      await fixture.whenStable();

      expect(filter('Asistencia pendiente').getAttribute('aria-pressed')).toBe('true');
      expect(names()).toEqual(['#4', '#3']);
      expect(acciones(3)).toEqual(['Asistió', 'No asistió']);
    });

    it('al marcar la asistencia la reserva sale del filtro y queda el texto vacío', async () => {
      vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
      await render([
        reserva({ id: 9, nombreCliente: 'Ana Pérez', estado: 'ACEPTADA', ...dentroDe(-60) }),
      ]);
      filter('Asistencia pendiente').click();
      await fixture.whenStable();

      element
        .querySelector<HTMLButtonElement>('[aria-label^="Marcar que Ana Pérez asistió"]')!
        .click();
      await settle(fixture);
      http
        .expectOne({ method: 'PATCH', url: '/api/reservas/9/estado' })
        .flush(reserva({ id: 9, nombreCliente: 'Ana Pérez', estado: 'ASISTIO', ...dentroDe(-60) }));
      await settle(fixture);

      expect(names()).toEqual([]);
      expect(element.querySelector('.empty')?.textContent).toContain(
        'No falta marcar la asistencia de ninguna reserva.',
      );
    });

    it('no ofrece acciones en los estados finales y los muestra con su etiqueta', async () => {
      await render([
        reserva({ id: 6, nombreCliente: '#6', estado: 'RECHAZADA', ...dentroDe(120) }),
        reserva({ id: 7, nombreCliente: '#7', estado: 'VENCIDA', ...dentroDe(120) }),
      ]);
      filter('Todas').click();
      await fixture.whenStable();

      expect(element.querySelectorAll('[data-accion]')).toHaveLength(0);
      const badges = [...element.querySelectorAll('.badge')].map((b) => b.textContent?.trim());
      expect(badges).toEqual(['Rechazada', 'Vencida']);
    });

    it('rechaza una pendiente tras confirmar y muestra el aviso', async () => {
      vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
      await render([reserva({ id: 9, nombreCliente: 'Ana Pérez', ...dentroDe(120) })]);

      element
        .querySelector<HTMLButtonElement>('[aria-label^="Rechazar la reserva de Ana Pérez"]')!
        .click();
      await settle(fixture);
      const req = http.expectOne({ method: 'PATCH', url: '/api/reservas/9/estado' });
      expect(req.request.body).toEqual({ estado: 'RECHAZADA' });
      req.flush(reserva({ id: 9, nombreCliente: 'Ana Pérez', estado: 'RECHAZADA' }));
      await settle(fixture);

      expect(element.querySelector('[role="status"]')?.textContent).toContain(
        'Reserva de Ana Pérez rechazada.',
      );
    });

    it('marca que no asistió y muestra el mensaje del servidor si la rechaza', async () => {
      vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
      await render([
        reserva({ id: 9, nombreCliente: 'Ana Pérez', estado: 'ACEPTADA', ...dentroDe(-60) }),
      ]);
      filter('Todas').click();
      await fixture.whenStable();

      element
        .querySelector<HTMLButtonElement>('[aria-label^="Marcar que Ana Pérez no asistió"]')!
        .click();
      await settle(fixture);
      const req = http.expectOne({ method: 'PATCH', url: '/api/reservas/9/estado' });
      expect(req.request.body).toEqual({ estado: 'NO_ASISTIO' });
      req.flush(
        { error: 'BUSINESS', mensaje: 'La reserva ya está cerrada' },
        { status: 400, statusText: 'Bad Request' },
      );
      await settle(fixture);

      expect(element.querySelector('[role="alert"]')?.textContent).toContain(
        'La reserva ya está cerrada',
      );
    });
  });
});
