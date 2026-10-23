import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegistrableRole } from '../../core/auth/auth.models';
import { Register } from './register';

describe('Register', () => {
  let http: HttpTestingController;

  const render = async (role: RegistrableRole) => {
    const fixture = TestBed.createComponent(Register);
    fixture.componentRef.setInput('role', role);
    await fixture.whenStable();
    return fixture;
  };

  const fill = (fixture: ComponentFixture<Register>, values: Record<string, string>) => {
    const element = fixture.nativeElement as HTMLElement;
    for (const [selector, value] of Object.entries(values)) {
      const control = element.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
      control.value = value;
      // Browsers fire both events on a select; FormField reacts to `input`.
      control.dispatchEvent(new Event('input'));
      control.dispatchEvent(new Event('change'));
    }
  };

  const submitForm = async (fixture: ComponentFixture<Register>) => {
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks restaurant details only for restaurants', async () => {
    const cliente = (await render('CLIENTE')).nativeElement as HTMLElement;
    const restaurante = (await render('RESTAURANTE')).nativeElement as HTMLElement;

    expect(cliente.querySelector('#register-restaurant-name')).toBeNull();
    expect(cliente.querySelector('#register-last-name')).not.toBeNull();
    expect(restaurante.querySelector('#register-restaurant-name')).not.toBeNull();
    expect(restaurante.querySelector('#register-specialty')).not.toBeNull();
    expect(restaurante.querySelector('#register-last-name')).toBeNull();
  });

  it('sends RegistroClienteDTO to the client endpoint', async () => {
    const fixture = await render('CLIENTE');
    fill(fixture, {
      '#register-first-name': 'Ana',
      '#register-last-name': 'Pérez',
      '#register-email': 'ana@foodies.com',
      '#register-password': 'secret123',
      '#register-phone': '2235550000',
    });

    await submitForm(fixture);

    const req = http.expectOne('/api/auth/register/cliente');
    expect(req.request.body).toEqual({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@foodies.com',
      password: 'secret123',
      telefono: '2235550000',
    });
    req.flush({});
  });

  it('sends RegistroRestauranteRequestDTO and shows the pending approval notice', async () => {
    const fixture = await render('RESTAURANTE');
    fill(fixture, {
      '#register-restaurant-name': 'La Parrilla',
      '#register-email': 'luis@foodies.com',
      '#register-password': 'secret123',
      '#register-phone': '2235551111',
      '#register-address': 'Calle 1',
      '#register-specialty': 'PARRILLA',
      '#register-capacity': '40',
    });

    await submitForm(fixture);

    const req = http.expectOne('/api/auth/register/restaurante');
    expect(req.request.body).toEqual({
      email: 'luis@foodies.com',
      password: 'secret123',
      telefono: '2235551111',
      nombreRestaurante: 'La Parrilla',
      direccion: 'Calle 1',
      especialidadDeComida: 'PARRILLA',
      cupoMaximo: 40,
    });
    req.flush({});
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('An admin must approve your restaurant');
  });
});
