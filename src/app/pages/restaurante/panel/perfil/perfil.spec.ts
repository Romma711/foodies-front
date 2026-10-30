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
  const submitForm = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Perfil);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me').flush(miRestaurante());
    await settle(fixture);
  });

  afterEach(() => http.verify());

  it('fills the form with the current restaurant', () => {
    expect(input('perfil-nombre').value).toBe('La Parrilla');
    expect(input('perfil-ubicacion').value).toBe('Calle 1');
    expect(input('perfil-cupo').value).toBe('40');
    expect(element.querySelector<HTMLSelectElement>('#perfil-especialidad')!.value).toBe(
      'PARRILLA',
    );
  });

  it('saves the changes', async () => {
    type('perfil-nombre', '  Nueva Parrilla ');
    type('perfil-cupo', '55');

    await submitForm();
    const req = http.expectOne({ method: 'PATCH', url: '/api/restaurantes/me' });
    expect(req.request.body).toEqual({
      nombre: 'Nueva Parrilla',
      ubicacion: 'Calle 1',
      cupoMaximo: 55,
      especialidad: 'PARRILLA',
    });
    req.flush(miRestaurante({ nombre: 'Nueva Parrilla', cupoMaximo: 55 }));
    await settle(fixture);

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cambios guardados.');
  });

  it('does not save an invalid capacity', async () => {
    type('perfil-cupo', '0');

    await submitForm();

    http.expectNone({ method: 'PATCH' });
    expect(element.textContent).toContain('La capacidad debe ser al menos 1.');
  });
});
