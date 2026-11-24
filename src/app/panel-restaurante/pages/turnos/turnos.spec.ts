import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Turno } from '../../models/panel.models';
import { providePanelTesting, settle } from '../../testing/panel.testing';
import { TurnosPanel } from './turnos';

describe('TurnosPanel', () => {
  let fixture: ComponentFixture<TurnosPanel>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const turno = (overrides: Partial<Turno> = {}): Turno => ({
    id: 1,
    dia: 'FRIDAY',
    inicio: '20:00',
    fin: '21:30',
    duracionMinutos: 90,
    ...overrides,
  });

  const render = async (turnos: Turno[]) => {
    fixture = TestBed.createComponent(TurnosPanel);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me/turnos').flush(turnos);
    await settle(fixture);
  };

  const escribir = (selector: string, valor: string, evento = 'input') => {
    const campo = element.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    campo.value = valor;
    campo.dispatchEvent(new Event(evento));
  };

  const enviar = async () => {
    element.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await settle(fixture);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosPanel],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('explica que sin turnos el cupo es por día', async () => {
    await render([]);

    expect(element.querySelector('[data-testid="sin-turnos"]')?.textContent).toContain(
      'el cupo de tus espacios es por día',
    );
  });

  it('lista los turnos agrupados por día de la semana y ordenados por hora', async () => {
    await render([
      turno({ id: 2, dia: 'FRIDAY', inicio: '21:30', fin: '23:00' }),
      turno({ id: 1, dia: 'FRIDAY' }),
      turno({ id: 3, dia: 'MONDAY', inicio: '12:00', fin: '13:30' }),
    ]);

    const dias = [...element.querySelectorAll('section.dia h2')].map((h) => h.textContent?.trim());
    expect(dias).toEqual(['Lunes', 'Viernes']);
    const viernes = [...element.querySelectorAll('section.dia')][1];
    expect(
      [...viernes.querySelectorAll('.rango')].map((r) =>
        r.textContent?.replace(/\s+/g, ' ').trim(),
      ),
    ).toEqual(['20:00 a 21:30 (90 min)', '21:30 a 23:00 (90 min)']);
  });

  it('crea un turno con día, inicio y duración y lo muestra', async () => {
    await render([]);

    escribir('#turno-dia', 'SATURDAY', 'change');
    escribir('#turno-inicio', '23:00');
    escribir('#turno-duracion', '60');
    await enviar();
    const req = http.expectOne({ method: 'POST', url: '/api/restaurantes/me/turnos' });
    expect(req.request.body).toEqual({ dia: 'SATURDAY', inicio: '23:00', duracionMinutos: 60 });
    req.flush(
      turno({ id: 8, dia: 'SATURDAY', inicio: '23:00', fin: '00:00', duracionMinutos: 60 }),
    );
    await settle(fixture);

    expect(element.querySelector('[data-turno="8"]')?.textContent).toContain('23:00 a 00:00');
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Agregaste el turno del Sábado de 23:00 a 00:00.',
    );
  });

  it('no envía una duración fuera de 15 a 360 minutos', async () => {
    await render([]);

    escribir('#turno-duracion', '400');
    await enviar();

    http.expectNone({ method: 'POST' });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'una duración entre 15 y 360 minutos',
    );
  });

  it('muestra tal cual el 409 de un turno repetido', async () => {
    await render([turno()]);

    escribir('#turno-dia', 'FRIDAY', 'change');
    await enviar();
    http
      .expectOne({ method: 'POST', url: '/api/restaurantes/me/turnos' })
      .flush(
        { error: 'CONFLICT', mensaje: 'Ya tenés un turno ese día a esa hora' },
        { status: 409, statusText: 'Conflict' },
      );
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Ya tenés un turno ese día a esa hora',
    );
  });

  it('modifica un turno existente con PUT', async () => {
    await render([turno()]);

    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Modificar el turno del Viernes a las 20:00"]',
      )!
      .click();
    await settle(fixture);
    expect(element.querySelector<HTMLInputElement>('#turno-inicio')!.value).toBe('20:00');
    escribir('#turno-inicio', '20:30');
    await enviar();
    const req = http.expectOne({ method: 'PUT', url: '/api/restaurantes/me/turnos/1' });
    expect(req.request.body).toEqual({ dia: 'FRIDAY', inicio: '20:30', duracionMinutos: 90 });
    req.flush(turno({ inicio: '20:30', fin: '22:00' }));
    await settle(fixture);

    expect(element.querySelector('[data-turno="1"]')?.textContent).toContain('20:30 a 22:00');
  });

  it('quita un turno tras confirmar y explica el 409 si tiene reservas futuras', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
    await render([turno(), turno({ id: 2, inicio: '21:30', fin: '23:00' })]);

    element
      .querySelector<HTMLButtonElement>('[aria-label="Quitar el turno del Viernes a las 20:00"]')!
      .click();
    await settle(fixture);
    http.expectOne({ method: 'DELETE', url: '/api/restaurantes/me/turnos/1' }).flush(null);
    await settle(fixture);
    expect(element.querySelector('[data-turno="1"]')).toBeNull();

    element
      .querySelector<HTMLButtonElement>('[aria-label="Quitar el turno del Viernes a las 21:30"]')!
      .click();
    await settle(fixture);
    http.expectOne({ method: 'DELETE', url: '/api/restaurantes/me/turnos/2' }).flush(
      {
        error: 'CONFLICT',
        mensaje: 'El turno tiene reservas activas a futuro: no se puede cambiar ni borrar.',
      },
      { status: 409, statusText: 'Conflict' },
    );
    await settle(fixture);

    expect(element.querySelector('[data-turno="2"]')).not.toBeNull();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'El turno tiene reservas activas a futuro',
    );
  });
});
