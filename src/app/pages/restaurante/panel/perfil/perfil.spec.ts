import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { miRestaurante, providePanelTesting, settle } from '../panel.testing';
import { Perfil } from './perfil';

describe('Perfil', () => {
  let fixture: ComponentFixture<Perfil>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const input = (id: string) => element.querySelector<HTMLInputElement>(`#${id}`)!;
  const type = (id: string, value: string) => {
    input(id).value = value;
    input(id).dispatchEvent(new Event('input'));
  };
  const check = (id: string, checked: boolean) => {
    if (input(id).checked !== checked) {
      input(id).click();
    }
  };
  const submitForm = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };

  const render = async (restaurante = miRestaurante()) => {
    fixture = TestBed.createComponent(Perfil);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me').flush(restaurante);
    await settle(fixture);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fills the form with the current restaurant', async () => {
    await render();
    expect(input('perfil-nombre').value).toBe('La Parrilla');
    expect(input('perfil-ubicacion').value).toBe('Calle 1');
    expect(input('perfil-cupo').value).toBe('40');
    expect(element.querySelector<HTMLSelectElement>('#perfil-especialidad')!.value).toBe(
      'PARRILLA',
    );
  });

  it('saves the changes', async () => {
    await render();
    type('perfil-nombre', '  Nueva Parrilla ');
    type('perfil-cupo', '55');

    await submitForm();
    const req = http.expectOne({ method: 'PATCH', url: '/api/restaurantes/me' });
    expect(req.request.body).toEqual({
      nombre: 'Nueva Parrilla',
      ubicacion: 'Calle 1',
      cupoMaximo: 55,
      especialidad: 'PARRILLA',
      porcentajeAutoAceptacion: 0,
    });
    req.flush(miRestaurante({ nombre: 'Nueva Parrilla', cupoMaximo: 55 }));
    await settle(fixture);

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cambios guardados.');
  });

  it('does not save an invalid capacity', async () => {
    await render();
    type('perfil-cupo', '0');

    await submitForm();

    http.expectNone({ method: 'PATCH' });
    expect(element.textContent).toContain('La capacidad debe ser al menos 1.');
  });

  it('muestra la aceptación automática apagada por defecto, sin pedir porcentaje', async () => {
    await render();

    expect(input('perfil-auto').checked).toBe(false);
    expect(element.querySelector('#perfil-porcentaje')).toBeNull();
  });

  it('carga el porcentaje de aceptación automática guardado', async () => {
    await render(miRestaurante({ porcentajeAutoAceptacion: 60 }));

    expect(input('perfil-auto').checked).toBe(true);
    expect(input('perfil-porcentaje').value).toBe('60');
    expect(element.textContent).toContain('hasta 24 personas por día');
  });

  it('activa la aceptación automática con el porcentaje elegido', async () => {
    await render();

    check('perfil-auto', true);
    await settle(fixture);
    type('perfil-porcentaje', '60');
    await submitForm();

    const req = http.expectOne({ method: 'PATCH', url: '/api/restaurantes/me' });
    expect(req.request.body).toEqual(expect.objectContaining({ porcentajeAutoAceptacion: 60 }));
    req.flush(miRestaurante({ porcentajeAutoAceptacion: 60 }));
    await settle(fixture);
  });

  it('apaga la aceptación automática enviando 0', async () => {
    await render(miRestaurante({ porcentajeAutoAceptacion: 60 }));

    check('perfil-auto', false);
    await submitForm();

    const req = http.expectOne({ method: 'PATCH', url: '/api/restaurantes/me' });
    expect(req.request.body).toEqual(expect.objectContaining({ porcentajeAutoAceptacion: 0 }));
    req.flush(miRestaurante());
    await settle(fixture);
  });

  it('no guarda un porcentaje fuera de 1 a 100', async () => {
    await render(miRestaurante({ porcentajeAutoAceptacion: 60 }));

    for (const invalido of ['0', '101']) {
      type('perfil-porcentaje', invalido);
      await submitForm();

      http.expectNone({ method: 'PATCH' });
      expect(element.textContent).toContain('El porcentaje debe estar entre 1 y 100.');
    }
  });
});
