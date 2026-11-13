import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FranjaHoraria } from '../../../../core/catalog/horarios';
import { violacionesAxe } from '../../../../shared/testing/axe';
import { providePanelTesting, settle } from '../panel.testing';
import { HorariosPanel } from './horarios';

describe('HorariosPanel', () => {
  let fixture: ComponentFixture<HorariosPanel>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const render = async (franjas: FranjaHoraria[] = []) => {
    fixture = TestBed.createComponent(HorariosPanel);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me/horarios').flush(franjas);
    await settle(fixture);
  };

  const dia = (nombre: string) =>
    Array.from(element.querySelectorAll<HTMLElement>('.dia')).find((d) =>
      d.querySelector('legend')?.textContent?.includes(nombre),
    )!;
  const boton = (raiz: ParentNode, texto: string) =>
    Array.from(raiz.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto)!;
  const tipear = (input: HTMLInputElement, valor: string) => {
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  };
  const guardar = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosPanel],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('muestra los siete días y avisa cuando no hay horario cargado', async () => {
    await render([]);

    expect(element.querySelectorAll('.dia')).toHaveLength(7);
    expect(element.textContent).toContain('se aceptan reservas a cualquier hora');
    expect(dia('Lunes').querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(
      false,
    );
  });

  it('carga las franjas guardadas en cada día', async () => {
    await render([
      { dia: 'SATURDAY', apertura: '12:00', cierre: '16:00' },
      { dia: 'SATURDAY', apertura: '20:00', cierre: '00:00' },
    ]);

    const sabado = dia('Sábado');
    expect(sabado.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
    const horas = Array.from(sabado.querySelectorAll<HTMLInputElement>('input[type="time"]')).map(
      (i) => i.value,
    );
    expect(horas).toEqual(['12:00', '16:00', '20:00', '00:00']);
    expect(element.textContent).not.toContain('se aceptan reservas a cualquier hora');
  });

  it('abre un día, agrega una franja y guarda la semana completa', async () => {
    await render([{ dia: 'SATURDAY', apertura: '20:00', cierre: '00:00' }]);

    const lunes = dia('Lunes');
    lunes.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await settle(fixture);
    const [apertura, cierre] = Array.from(
      lunes.querySelectorAll<HTMLInputElement>('input[type="time"]'),
    );
    tipear(apertura, '12:00');
    tipear(cierre, '15:00');
    boton(lunes, 'Agregar franja').click();
    await settle(fixture);
    await guardar();

    const req = http.expectOne({ method: 'PUT', url: '/api/restaurantes/me/horarios' });
    expect(req.request.body).toEqual([
      { dia: 'MONDAY', apertura: '12:00', cierre: '15:00' },
      { dia: 'MONDAY', apertura: '20:00', cierre: '00:00' },
      { dia: 'SATURDAY', apertura: '20:00', cierre: '00:00' },
    ]);
    req.flush(req.request.body);
    await settle(fixture);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Horario guardado.');
  });

  it('cerrar un día no envía sus franjas y no deja más de tres por día', async () => {
    await render([
      { dia: 'FRIDAY', apertura: '08:00', cierre: '10:00' },
      { dia: 'FRIDAY', apertura: '11:00', cierre: '13:00' },
      { dia: 'FRIDAY', apertura: '14:00', cierre: '16:00' },
      { dia: 'SUNDAY', apertura: '20:00', cierre: '00:00' },
    ]);

    expect(boton(dia('Viernes'), 'Agregar franja')).toBeUndefined();
    dia('Domingo').querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await settle(fixture);
    await guardar();

    const req = http.expectOne({ method: 'PUT' });
    expect(req.request.body.map((f: FranjaHoraria) => f.dia)).toEqual([
      'FRIDAY',
      'FRIDAY',
      'FRIDAY',
    ]);
    req.flush(req.request.body);
    await settle(fixture);
  });

  it('muestra el motivo del backend si el horario no es válido', async () => {
    await render([{ dia: 'MONDAY', apertura: '12:00', cierre: '16:00' }]);

    await guardar();
    http
      .expectOne({ method: 'PUT' })
      .flush(
        { error: 'error de negocio', mensaje: 'Las franjas del mismo día se superponen' },
        { status: 400, statusText: 'Bad Request' },
      );
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Las franjas del mismo día se superponen',
    );
  });

  it('pasa axe', async () => {
    await render([{ dia: 'SATURDAY', apertura: '12:00', cierre: '16:00' }]);

    expect(await violacionesAxe(element)).toEqual([]);
  });
});
