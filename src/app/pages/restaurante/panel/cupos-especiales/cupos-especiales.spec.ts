import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { CupoEspecial, Espacio } from '../panel.models';
import { daysFromToday, espacio, providePanelTesting, settle } from '../panel.testing';
import { CuposEspeciales } from './cupos-especiales';

describe('CuposEspeciales', () => {
  let fixture: ComponentFixture<CuposEspeciales>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const salon = espacio({ id: 3, nombre: 'Salón principal', capacidad: 40 });
  const patio = espacio({ id: 4, tipo: 'PATIO', nombre: 'Patio', capacidad: 12 });
  const barraInactiva = espacio({ id: 5, tipo: 'BARRA', nombre: 'Barra', capacidad: 6, activo: false });

  const cupo = (overrides: Partial<CupoEspecial> = {}): CupoEspecial => ({
    fecha: daysFromToday(5),
    cupo: 20,
    motivo: 'Cumpleaños privado',
    reservadas: 6,
    idEspacio: 3,
    espacioNombre: 'Salón principal',
    ...overrides,
  });

  const render = async (cupos: CupoEspecial[] = [], espacios: Espacio[] = [salon, patio, barraInactiva]) => {
    fixture = TestBed.createComponent(CuposEspeciales);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me/espacios').flush(espacios);
    http.expectOne('/api/restaurantes/me/cupos-especiales').flush(cupos);
    await settle(fixture);
  };

  const input = (id: string) => element.querySelector<HTMLInputElement>(`#${id}`)!;
  const type = (id: string, value: string) => {
    input(id).value = value;
    input(id).dispatchEvent(new Event('input'));
  };
  const select = (id: string, value: string) => {
    const el = element.querySelector<HTMLSelectElement>(`#${id}`)!;
    el.value = value;
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
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

  it('muestra los próximos días con capacidad especial, su espacio y sus reservas', async () => {
    await render([cupo()]);

    const item = element.querySelector('.cupo')!;
    expect(item.textContent).toContain('Salón principal');
    expect(item.textContent).toContain('20 personas');
    expect(item.textContent).toContain('6 ya reservadas');
    expect(item.textContent).toContain('Cumpleaños privado');
    expect(element.textContent).toContain('La capacidad normal de Salón principal es de 40 personas por día.');
  });

  it('solo ofrece los espacios activos', async () => {
    await render([]);

    const opciones = Array.from(element.querySelectorAll('#cupo-espacio option')).map((o) =>
      o.textContent?.trim(),
    );
    expect(opciones).toEqual(['Salón principal', 'Patio']);
  });

  it('muestra un estado vacío', async () => {
    await render([]);

    expect(element.textContent).toContain('No cargaste días con capacidad especial.');
  });

  it('guarda un cupo especial para el espacio elegido y lo agrega a la lista', async () => {
    await render([]);
    const fecha = daysFromToday(10);

    select('cupo-espacio', '4');
    type('cupo-fecha', fecha);
    type('cupo-cantidad', '0');
    type('cupo-motivo', '  Lluvia ');
    await submitForm();

    const req = http.expectOne({
      method: 'PUT',
      url: `/api/restaurantes/me/espacios/4/cupos-especiales/${fecha}`,
    });
    expect(req.request.body).toEqual({ cupo: 0, motivo: 'Lluvia' });
    req.flush(cupo({ fecha, cupo: 0, motivo: 'Lluvia', reservadas: 0, idEspacio: 4, espacioNombre: 'Patio' }));
    await settle(fixture);

    expect(element.querySelector('.cupo')?.textContent).toContain('Patio');
    expect(element.querySelector('.cupo')?.textContent).toContain('0 personas');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Capacidad especial guardada.');
  });

  it('el mismo día puede tener cupos especiales en dos espacios', async () => {
    const fecha = daysFromToday(10);
    await render([cupo({ fecha })]);

    select('cupo-espacio', '4');
    type('cupo-fecha', fecha);
    type('cupo-cantidad', '5');
    await submitForm();
    http.expectOne({ method: 'PUT' })
      .flush(cupo({ fecha, cupo: 5, idEspacio: 4, espacioNombre: 'Patio', reservadas: 0 }));
    await settle(fixture);

    expect(element.querySelectorAll('.cupo')).toHaveLength(2);
  });

  it('envía el motivo vacío como null', async () => {
    await render([]);
    const fecha = daysFromToday(10);

    type('cupo-fecha', fecha);
    type('cupo-cantidad', '15');
    await submitForm();

    const req = http.expectOne({ method: 'PUT' });
    expect(req.request.url).toContain('/espacios/3/');
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

  it('no guarda un cupo mayor a la capacidad del espacio ni un día pasado', async () => {
    await render([]);

    select('cupo-espacio', '4');
    type('cupo-fecha', daysFromToday(10));
    type('cupo-cantidad', '13');
    await submitForm();
    expect(element.textContent).toContain('El cupo debe estar entre 0 y 12.');

    type('cupo-cantidad', '10');
    type('cupo-fecha', daysFromToday(-1));
    await submitForm();
    expect(element.textContent).toContain('Elegí un día de hoy en adelante.');

    http.expectNone({ method: 'PUT' });
  });

  it('quita un cupo especial después de confirmar', async () => {
    const open = vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
    const actual = cupo({ idEspacio: 4, espacioNombre: 'Patio' });
    await render([actual]);

    element.querySelector<HTMLButtonElement>('.cupo button')!.click();
    await settle(fixture);

    expect(open.mock.calls[0][0].message).toContain('Patio vuelve a su capacidad normal de 12 personas');
    http
      .expectOne({
        method: 'DELETE',
        url: `/api/restaurantes/me/espacios/4/cupos-especiales/${actual.fecha}`,
      })
      .flush(null);
    await settle(fixture);

    expect(element.querySelector('.cupo')).toBeNull();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Capacidad especial quitada.');
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
