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

  const imagen = (nombre: string) => new File(['img'], nombre, { type: 'image/jpeg' });

  const choose = (fixture: ComponentFixture<Register>, selector: string, files: File[]) => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector)!;
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
  };

  const portada = (fixture: ComponentFixture<Register>, n: number) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      `input[aria-label="Usar la foto ${n} como portada"]`,
    )!;

  const quitar = (fixture: ComponentFixture<Register>, nombre: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `button[aria-label="Quitar ${nombre}"]`,
    )!;

  const fillRestaurante = (fixture: ComponentFixture<Register>) =>
    fill(fixture, {
      '#register-restaurant-name': 'La Parrilla',
      '#register-email': 'luis@foodies.com',
      '#register-password': 'secret123',
      '#register-phone': '2235551111',
      '#register-address': 'Calle 1',
      '#register-specialty': 'PARRILLA',
      '#register-capacity': '40',
    });

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

  it('sends RegistroRestauranteRequestDTO with the photos and shows the pending approval notice', async () => {
    const fixture = await render('RESTAURANTE');
    fillRestaurante(fixture);
    choose(fixture, '#register-photos', ['1', '2', '3'].map((n) => imagen(`foto-${n}.jpg`)));
    await fixture.whenStable();
    portada(fixture, 2).click();
    await fixture.whenStable();

    await submitForm(fixture);

    const req = http.expectOne('/api/auth/register/restaurante');
    const body = req.request.body as FormData;
    expect(JSON.parse(await (body.get('datos') as Blob).text())).toEqual({
      email: 'luis@foodies.com',
      password: 'secret123',
      telefono: '2235551111',
      nombreRestaurante: 'La Parrilla',
      direccion: 'Calle 1',
      especialidadDeComida: 'PARRILLA',
      cupoMaximo: 40,
    });
    expect((body.getAll('fotos') as File[]).map((f) => f.name)).toEqual([
      'foto-1.jpg',
      'foto-2.jpg',
      'foto-3.jpg',
    ]);
    expect(body.get('portada')).toBe('1');
    req.flush({});
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent,
    ).toContain('Un administrador debe aprobar tu restaurante');
  });

  it('does not register a restaurant without the required photos', async () => {
    const fixture = await render('RESTAURANTE');
    fillRestaurante(fixture);
    choose(fixture, '#register-photos', [imagen('foto-1.jpg'), imagen('foto-2.jpg')]);
    await fixture.whenStable();

    await submitForm(fixture);

    http.expectNone('/api/auth/register/restaurante');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Subí al menos 3 fotos del restaurante.',
    );
  });

  it('rejects photos that are not images or are larger than 5 MB', async () => {
    const fixture = await render('RESTAURANTE');
    fillRestaurante(fixture);
    const grande = imagen('grande.jpg');
    Object.defineProperty(grande, 'size', { value: 5 * 1024 * 1024 + 1 });
    choose(fixture, '#register-photos', [
      new File(['x'], 'menu.pdf', { type: 'application/pdf' }),
      imagen('foto-1.jpg'),
      grande,
    ]);
    await fixture.whenStable();

    await submitForm(fixture);
    http.expectNone('/api/auth/register/restaurante');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '"menu.pdf" no es una imagen JPG, PNG o WebP.',
    );

    quitar(fixture, 'menu.pdf').click();
    choose(fixture, '#register-photos', [imagen('foto-2.jpg')]);
    await fixture.whenStable();
    await submitForm(fixture);
    http.expectNone('/api/auth/register/restaurante');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      '"grande.jpg" pesa más de 5 MB.',
    );
  });

  it('keeps at most 5 photos and uses the first one as cover until another is chosen', async () => {
    const fixture = await render('RESTAURANTE');
    choose(
      fixture,
      '#register-photos',
      ['1', '2', '3', '4', '5', '6'].map((n) => imagen(`foto-${n}.jpg`)),
    );
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.foto-registro')).toHaveLength(5);
    expect(element.querySelector<HTMLInputElement>('#register-photos')!.disabled).toBe(true);
    expect(portada(fixture, 1).checked).toBe(true);

    // Si se quita la portada, la primera que queda pasa a ser la portada.
    portada(fixture, 3).click();
    await fixture.whenStable();
    quitar(fixture, 'foto-3.jpg').click();
    await fixture.whenStable();
    expect(element.querySelectorAll('.foto-registro')).toHaveLength(4);
    expect(portada(fixture, 1).checked).toBe(true);

    // Si se quita una anterior a la portada, la portada sigue siendo la misma foto.
    portada(fixture, 3).click();
    await fixture.whenStable();
    quitar(fixture, 'foto-1.jpg').click();
    await fixture.whenStable();
    expect(portada(fixture, 2).checked).toBe(true);
    expect(element.querySelectorAll('.foto-registro')[1].textContent).toContain('foto-4.jpg');
  });

  describe('when the backend rejects the registration', () => {
    const registerClienteAndFail = async (status: number, body: object | null) => {
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
      if (status === 0) {
        req.error(new ProgressEvent('error'), { status: 0 });
      } else {
        req.flush(body, { status, statusText: 'Error' });
      }
      await new Promise((resolve) => setTimeout(resolve));
      await fixture.whenStable();
      return (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent;
    };

    it('shows the validation message the backend sent', async () => {
      const alert = await registerClienteAndFail(400, {
        telefono: 'El teléfono debe tener 10 dígitos',
      });

      expect(alert).toContain('El teléfono debe tener 10 dígitos');
    });

    it('shows the business rule message the backend sent', async () => {
      const alert = await registerClienteAndFail(400, {
        error: 'error de negocio',
        mensaje: 'El email no es válido para este portal.',
      });

      expect(alert).toContain('El email no es válido para este portal.');
    });

    it('keeps the generic invalid data message when the backend sends no detail', async () => {
      const alert = await registerClienteAndFail(400, null);

      expect(alert).toContain('Algunos datos no son válidos. Revisá el formulario.');
    });

    it('keeps the duplicate email message', async () => {
      const alert = await registerClienteAndFail(409, {
        error: 'conflicto',
        mensaje: 'Email duplicado',
      });

      expect(alert).toContain('Ya existe una cuenta con este email.');
    });

    it('tells the user the server could not be reached', async () => {
      const alert = await registerClienteAndFail(0, null);

      expect(alert).toContain('No se pudo conectar con el servidor.');
    });
  });
});
