import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18n } from '@core/i18n/i18n.service';
import { EntradaListaEsperaPanel } from '../../models/panel.models';
import { providePanelTesting, settle } from '../../testing/panel.testing';
import { violacionesAxe } from '../../../shared/testing/axe';
import { ListaEsperaPanel } from './lista-espera';

describe('ListaEsperaPanel (S7d, D23)', () => {
  let fixture: ComponentFixture<ListaEsperaPanel>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const entrada = (overrides: Partial<EntradaListaEsperaPanel> = {}): EntradaListaEsperaPanel => ({
    id: 1,
    fecha: '2026-12-04',
    horario: '20:00',
    idTurno: 147,
    cantidad: 2,
    estado: 'ESPERANDO',
    creada: '2026-11-25T10:30:00',
    cliente: 'Ana Gómez',
    ...overrides,
  });

  const render = async (entradas: EntradaListaEsperaPanel[]) => {
    fixture = TestBed.createComponent(ListaEsperaPanel);
    element = fixture.nativeElement;
    await fixture.whenStable();
    const req = http.expectOne('/api/restaurantes/me/lista-espera');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('fecha')).toBe(false);
    req.flush(entradas);
    await settle(fixture);
  };

  const filas = () => Array.from(element.querySelectorAll('[data-testid="entrada"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEsperaPanel],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.inject(I18n).usar('es');
  });

  it('lista las inscripciones con turno, personas, cliente, estado y cuándo se anotó', async () => {
    await render([
      entrada(),
      entrada({
        id: 2,
        horario: '21:30',
        cantidad: 1,
        estado: 'NOTIFICADA',
        cliente: 'Juan Pérez',
        creada: '2026-11-25T11:45:00',
      }),
    ]);

    expect(element.querySelector('h1')?.textContent).toContain('Lista de espera');
    expect(filas().length).toBe(2);
    expect(filas()[0].textContent).toContain('20:00');
    expect(filas()[0].textContent).toContain('Ana Gómez');
    expect(filas()[0].textContent).toContain('2 personas');
    expect(filas()[0].textContent).toContain('Esperando');
    expect(filas()[0].textContent).toContain('10:30');
    expect(filas()[1].textContent).toContain('21:30');
    expect(filas()[1].textContent).toContain('1 persona');
    expect(filas()[1].textContent).toContain('Avisado por mail');
    expect(element.querySelector('section h2')?.textContent).toContain('4 de diciembre de 2026');
  });

  it('pasa axe con inscripciones', async () => {
    await render([entrada(), entrada({ id: 2, estado: 'NOTIFICADA' })]);

    expect(await violacionesAxe(element)).toEqual([]);
  });

  it('agrupa por día', async () => {
    await render([entrada(), entrada({ id: 2, fecha: '2026-12-05' })]);

    expect(element.querySelectorAll('section h2').length).toBe(2);
  });

  it('sin inscripciones muestra un texto', async () => {
    await render([]);

    expect(element.querySelector('[data-testid="vacio"]')?.textContent).toContain(
      'No hay nadie en la lista de espera de los próximos días.',
    );
  });

  it('filtra por fecha y vuelve a las próximas al limpiar', async () => {
    await render([entrada()]);

    const fecha = element.querySelector<HTMLInputElement>('#lista-espera-fecha')!;
    expect(element.querySelector('label[for="lista-espera-fecha"]')?.textContent).toContain(
      'Fecha',
    );
    fecha.value = '2026-12-10';
    fecha.dispatchEvent(new Event('change'));
    await settle(fixture);
    const req = http.expectOne(
      (r) =>
        r.url === '/api/restaurantes/me/lista-espera' && r.params.get('fecha') === '2026-12-10',
    );
    req.flush([]);
    await settle(fixture);

    expect(element.querySelector('[data-testid="vacio"]')?.textContent).toContain(
      'No hay nadie en la lista de espera ese día.',
    );

    Array.from(element.querySelectorAll('button'))
      .find((b) => b.textContent?.trim() === 'Ver próximos días')!
      .click();
    await settle(fixture);
    http.expectOne('/api/restaurantes/me/lista-espera').flush([entrada()]);
    await settle(fixture);

    expect(filas().length).toBe(1);
  });

  it('si falla la carga muestra el error con reintentar', async () => {
    fixture = TestBed.createComponent(ListaEsperaPanel);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http
      .expectOne('/api/restaurantes/me/lista-espera')
      .flush(null, { status: 500, statusText: 'Server Error' });
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar la lista de espera.',
    );
  });

  it('se traduce al inglés', async () => {
    await render([entrada({ estado: 'NOTIFICADA' })]);

    TestBed.inject(I18n).usar('en');
    await settle(fixture);

    expect(element.querySelector('h1')?.textContent).toContain('Waitlist');
    expect(filas()[0].textContent).toContain('Notified by email');
    expect(filas()[0].textContent).toContain('2 guests');
  });
});
