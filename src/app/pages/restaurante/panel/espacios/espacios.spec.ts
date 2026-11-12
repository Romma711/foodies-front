import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { violacionesAxe } from '../../../../shared/testing/axe';
import { Espacio } from '../panel.models';
import { espacio, providePanelTesting, settle } from '../panel.testing';
import { EspaciosPanel } from './espacios';

describe('EspaciosPanel', () => {
  let fixture: ComponentFixture<EspaciosPanel>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const salon = espacio();
  const patio = espacio({ id: 4, tipo: 'PATIO', nombre: 'Patio trasero', capacidad: 20 });

  const render = async (espacios: Espacio[] = [salon, patio]) => {
    fixture = TestBed.createComponent(EspaciosPanel);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me/espacios').flush(espacios);
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
    // Browsers fire both events when the user picks an option.
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
  };
  const submitForm = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };
  const item = (nombre: string) =>
    Array.from(element.querySelectorAll<HTMLElement>('.espacio')).find((li) =>
      li.textContent?.includes(nombre),
    )!;
  const boton = (li: HTMLElement, texto: string) =>
    Array.from(li.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto)!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaciosPanel],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('agrupa los espacios por tipo y muestra la capacidad total de los activos', async () => {
    await render([salon, patio, espacio({ id: 5, tipo: 'BARRA', nombre: 'Barra', capacidad: 6, activo: false })]);

    const grupos = Array.from(element.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    expect(grupos).toEqual(['Salones', 'Patios', 'Barras']);
    expect(item('Patio trasero').textContent).toContain('20 personas');
    expect(item('Barra').textContent).toContain('Inactivo');
    expect(element.textContent).toContain('Capacidad total: 60 personas por día');
  });

  it('agrega un espacio nuevo', async () => {
    await render([salon]);

    select('espacio-tipo', 'BARRA');
    type('espacio-nombre', '  Barra de tragos ');
    type('espacio-capacidad', '8');
    await submitForm();

    const req = http.expectOne({ method: 'POST', url: '/api/restaurantes/me/espacios' });
    expect(req.request.body).toEqual({ tipo: 'BARRA', nombre: 'Barra de tragos', capacidad: 8 });
    req.flush(espacio({ id: 9, tipo: 'BARRA', nombre: 'Barra de tragos', capacidad: 8 }));
    await settle(fixture);

    expect(item('Barra de tragos').textContent).toContain('8 personas');
    expect(element.textContent).toContain('Capacidad total: 48 personas por día');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Espacio agregado.');
    expect(input('espacio-nombre').value).toBe('');
  });

  it('valida nombre y capacidad antes de enviar', async () => {
    await render([salon]);

    type('espacio-nombre', ' ');
    type('espacio-capacidad', '0');
    await submitForm();

    expect(element.textContent).toContain('Indicá el nombre del espacio.');
    expect(element.textContent).toContain('La capacidad debe ser al menos 1.');
    http.expectNone({ method: 'POST' });
  });

  it('edita un espacio existente con el mismo formulario', async () => {
    await render();

    boton(item('Patio trasero'), 'Editar').click();
    await settle(fixture);
    expect(input('espacio-nombre').value).toBe('Patio trasero');
    type('espacio-capacidad', '15');
    await submitForm();

    const req = http.expectOne({ method: 'PUT', url: '/api/restaurantes/me/espacios/4' });
    expect(req.request.body).toEqual({ tipo: 'PATIO', nombre: 'Patio trasero', capacidad: 15 });
    req.flush({ ...patio, capacidad: 15 });
    await settle(fixture);

    expect(item('Patio trasero').textContent).toContain('15 personas');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Espacio guardado.');
  });

  it('muestra el motivo del backend si no se puede guardar', async () => {
    await render([salon]);

    type('espacio-nombre', 'salón principal');
    type('espacio-capacidad', '5');
    await submitForm();
    http.expectOne({ method: 'POST' }).flush(
      { error: 'error de negocio', mensaje: 'Ya tenés un espacio con ese nombre' },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Ya tenés un espacio con ese nombre',
    );
  });

  it('desactiva un espacio después de confirmar y lo vuelve a activar', async () => {
    const open = vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
    await render();

    boton(item('Patio trasero'), 'Desactivar').click();
    await settle(fixture);
    expect(open).toHaveBeenCalled();
    const req = http.expectOne({ method: 'PATCH', url: '/api/restaurantes/me/espacios/4/activo' });
    expect(req.request.body).toEqual({ activo: false });
    req.flush({ ...patio, activo: false });
    await settle(fixture);
    expect(item('Patio trasero').textContent).toContain('Inactivo');
    expect(element.textContent).toContain('Capacidad total: 40 personas por día');

    boton(item('Patio trasero'), 'Activar').click();
    await settle(fixture);
    const activar = http.expectOne({ method: 'PATCH', url: '/api/restaurantes/me/espacios/4/activo' });
    expect(activar.request.body).toEqual({ activo: true });
    activar.flush(patio);
    await settle(fixture);
    expect(item('Patio trasero').textContent).not.toContain('Inactivo');
  });

  it('no desactiva si el encargado vuelve atrás y muestra el error del backend', async () => {
    const open = vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(false);
    await render();

    boton(item('Patio trasero'), 'Desactivar').click();
    await settle(fixture);
    http.expectNone({ method: 'PATCH' });

    open.mockResolvedValue(true);
    boton(item('Patio trasero'), 'Desactivar').click();
    await settle(fixture);
    http.expectOne({ method: 'PATCH' }).flush(
      { error: 'error de negocio', mensaje: 'No podés desactivar un espacio con reservas pendientes' },
      { status: 400, statusText: 'Bad Request' },
    );
    await settle(fixture);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No podés desactivar un espacio con reservas pendientes',
    );
    expect(item('Patio trasero').textContent).not.toContain('Inactivo');
  });

  it('pasa axe', async () => {
    await render();

    expect(await violacionesAxe(element)).toEqual([]);
  });
});
