import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { CupoEspecial } from '../panel.models';
import { daysFromToday, miRestaurante, providePanelTesting, settle } from '../panel.testing';
import { CuposEspeciales } from './cupos-especiales';

describe('CuposEspeciales', () => {
  let fixture: ComponentFixture<CuposEspeciales>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const cupo = (overrides: Partial<CupoEspecial> = {}): CupoEspecial => ({
    fecha: daysFromToday(5),
    cupo: 20,
    motivo: 'Cumpleaños privado',
    reservadas: 6,
    ...overrides,
  });

  const render = async (cupos: CupoEspecial[] = []) => {
    fixture = TestBed.createComponent(CuposEspeciales);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me').flush(miRestaurante({ cupoMaximo: 40 }));
    http.expectOne('/api/restaurantes/me/cupos-especiales').flush(cupos);
    await settle(fixture);
  };

  const input = (id: string) => element.querySelector<HTMLInputElement>(`#${id}`)!;
  const type = (id: string, value: string) => {
    input(id).value = value;
    input(id).dispatchEvent(new Event('input'));
  };
  const submitForm = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuposEspeciales],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('muestra los próximos días con capacidad especial y sus reservas', async () => {
    await render([cupo()]);

    const item = element.querySelector('.cupo')!;
    expect(item.textContent).toContain('20 personas');
    expect(item.textContent).toContain('6 ya reservadas');
    expect(item.textContent).toContain('Cumpleaños privado');
    expect(element.textContent).toContain('Tu capacidad normal es de 40 personas por día.');
  });

  it('muestra un estado vacío', async () => {
    await render([]);

    expect(element.textContent).toContain('No cargaste días con capacidad especial.');
  });

  it('guarda un cupo especial y lo agrega a la lista', async () => {
    await render([]);
    const fecha = daysFromToday(10);

    type('cupo-fecha', fecha);
    type('cupo-cantidad', '15');
    type('cupo-motivo', '  Evento privado ');
    await submitForm();

    const req = http.expectOne({ method: 'PUT', url: `/api/restaurantes/me/cupos-especiales/${fecha}` });
    expect(req.request.body).toEqual({ cupo: 15, motivo: 'Evento privado' });
    req.flush(cupo({ fecha, cupo: 15, motivo: 'Evento privado', reservadas: 0 }));
    await settle(fixture);

    expect(element.querySelector('.cupo')?.textContent).toContain('15 personas');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Capacidad especial guardada.');
  });

  it('envía el motivo vacío como null', async () => {
    await render([]);
    const fecha = daysFromToday(10);

    type('cupo-fecha', fecha);
    type('cupo-cantidad', '15');
    await submitForm();

    const req = http.expectOne({ method: 'PUT' });
    expect(req.request.body).toEqual({ cupo: 15, motivo: null });
    req.flush(cupo({ fecha, cupo: 15, motivo: null, reservadas: 0 }));
    await settle(fixture);
  });

  it('muestra el motivo del backend cuando ya hay más reservas que el cupo nuevo', async () => {
    await render([]);

    type('cupo-fecha', daysFromToday(10));
    type('cupo-cantidad', '5');
    await submitForm();
    http.expectOne({ method: 'PUT' }).flush(
      {
        error: 'error de negocio',
        mensaje: 'Ya hay 6 personas reservadas ese día. No podés bajar el cupo a menos de 6.',
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Ya hay 6 personas reservadas ese día. No podés bajar el cupo a menos de 6.',
    );
    expect(element.querySelector('.cupo')).toBeNull();
  });

  it('no guarda un cupo mayor a la capacidad normal ni un día pasado', async () => {
    await render([]);

    type('cupo-fecha', daysFromToday(10));
    type('cupo-cantidad', '41');
    await submitForm();
    expect(element.textContent).toContain('El cupo debe estar entre 0 y 40.');

    type('cupo-cantidad', '10');
    type('cupo-fecha', daysFromToday(-1));
    await submitForm();
    expect(element.textContent).toContain('Elegí un día de hoy en adelante.');

    http.expectNone({ method: 'PUT' });
  });

  it('quita un cupo especial después de confirmar', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
    const actual = cupo();
    await render([actual]);

    element.querySelector<HTMLButtonElement>('.cupo button')!.click();
    await settle(fixture);
    http
      .expectOne({ method: 'DELETE', url: `/api/restaurantes/me/cupos-especiales/${actual.fecha}` })
      .flush(null);
    await settle(fixture);

    expect(element.querySelector('.cupo')).toBeNull();
  });

  it('no quita el cupo especial si el encargado vuelve atrás', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(false);
    await render([cupo()]);

    element.querySelector<HTMLButtonElement>('.cupo button')!.click();
    await settle(fixture);

    http.expectNone({ method: 'DELETE' });
    expect(element.querySelector('.cupo')).not.toBeNull();
  });
});
