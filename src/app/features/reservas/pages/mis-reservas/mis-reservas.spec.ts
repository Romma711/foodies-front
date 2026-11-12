import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ReservaDetailDTO, ReservaListDTO } from '../../models';
import { EspaciosService } from '../../services/espacios.service';
import { ReservaService } from '../../services/reserva.service';
import { fechaLocal } from '../../utils/reserva-reglas';
import { MisReservas } from './mis-reservas';

describe('MisReservas', () => {
  const reservasMock: ReservaListDTO[] = [
    {
      id: 6,
      cantidad: 2,
      fechaReserva: '2026-11-20T15:00:00.000+00:00',
      horariollegada: '20:00:00',
      estadoReserva: 'PENDIENTE',
      nombreResto: 'Ochiwan',
      idRestaurant: 5,
      idEspacio: 3,
      espacioNombre: 'Salón principal',
    },
    {
      id: 7,
      cantidad: 4,
      fechaReserva: '2026-11-22T15:00:00.000+00:00',
      horariollegada: '21:30:00',
      estadoReserva: 'ACEPTADA',
      nombreResto: 'La Trattoria',
      idRestaurant: 5,
      idEspacio: 3,
      espacioNombre: 'Salón principal',
    },
  ];

  const cancelada: ReservaDetailDTO = {
    id: 6,
    cantidad: 2,
    fecha: '2026-11-20T15:00:00.000+00:00',
    horariollegada: '20:00:00',
    estadoReserva: 'CANCELADA',
    nombreUsuario: 'Demo',
    nombreResto: 'Ochiwan',
    idEspacio: 3,
    espacioNombre: 'Salón principal',
  };

  let reservas: WritableSignal<ReservaListDTO[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let listarPorUsuario: ReturnType<typeof vi.fn>;
  let cancelar: ReturnType<typeof vi.fn>;
  let limpiarErrorMutacion: ReturnType<typeof vi.fn>;
  let modificar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    reservas = signal(reservasMock);
    cargando = signal(false);
    error = signal<string | null>(null);
    saving = signal(false);
    mutationError = signal<string | null>(null);
    listarPorUsuario = vi.fn(() => of(reservas()));
    cancelar = vi.fn(() => of(cancelada));
    limpiarErrorMutacion = vi.fn();
    modificar = vi.fn();

    await TestBed.configureTestingModule({
      imports: [MisReservas],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { userId: vi.fn(() => 29) },
        },
        {
          provide: EspaciosService,
          useValue: {
            listar: vi.fn(() =>
              of([
                { id: 3, tipo: 'SALON', nombre: 'Salón principal', hayLugar: true },
                { id: 4, tipo: 'PATIO', nombre: 'Patio', hayLugar: false },
                { id: 5, tipo: 'BARRA', nombre: 'Barra', hayLugar: true },
              ]),
            ),
          },
        },
        {
          provide: ReservaService,
          useValue: {
            reservas: reservas.asReadonly(),
            loading: cargando.asReadonly(),
            error: error.asReadonly(),
            saving: saving.asReadonly(),
            mutationError: mutationError.asReadonly(),
            listarPorUsuario,
            cancelar,
            modificar,
            limpiarErrorMutacion,
          },
        },
      ],
    }).compileComponents();
  });

  function crearComponente() {
    const fixture = TestBed.createComponent(MisReservas);
    fixture.detectChanges();
    return fixture;
  }

  it('debería listar las reservas del cliente con su estado', () => {
    const fixture = crearComponente();
    const texto = fixture.nativeElement.textContent as string;

    expect(listarPorUsuario).toHaveBeenCalledWith(29);
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(2);
    expect(texto).toContain('Ochiwan');
    expect(texto).toContain('Salón principal');
    expect(texto).toContain('La Trattoria');
    expect(texto).toContain('Pendiente');
    expect(texto).toContain('Confirmada');
    expect(texto).toContain('2 reservas');
  });

  it('debería cancelar una reserva pendiente tras confirmar', () => {
    const fixture = crearComponente();
    const elemento = fixture.nativeElement as HTMLElement;
    const cancelarReserva = Array.from(elemento.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Cancelar reserva'),
    ) as HTMLButtonElement;

    cancelarReserva.click();
    fixture.detectChanges();

    expect(elemento.textContent).toContain('¿Cancelar esta reserva?');

    const confirmar = Array.from(elemento.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Sí, cancelar'),
    ) as HTMLButtonElement;
    confirmar.click();
    fixture.detectChanges();

    expect(cancelar).toHaveBeenCalledWith(6);
    expect(elemento.textContent).not.toContain('¿Cancelar esta reserva?');
  });

  it('debería mostrar el estado vacío', () => {
    reservas.set([]);
    const fixture = crearComponente();

    expect(fixture.nativeElement.textContent).toContain('Todavía no tenés reservas');
  });

  it('debería mostrar el error y permitir reintentar', () => {
    error.set('No se pudo conectar con el servidor.');
    const fixture = crearComponente();
    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alerta.textContent).toContain('No se pudo conectar con el servidor.');

    (alerta.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(listarPorUsuario).toHaveBeenCalledTimes(2);
  });
  describe('modificar', () => {
    const fecha = fechaLocal(5);
    const pendiente: ReservaListDTO = {
      id: 6,
      cantidad: 2,
      fechaReserva: fecha,
      horariollegada: '20:00:00',
      estadoReserva: 'PENDIENTE',
      nombreResto: 'Ochiwan',
      idRestaurant: 5,
      idEspacio: 3,
      espacioNombre: 'Salón principal',
    };

    function botonesModificar(elemento: HTMLElement): HTMLButtonElement[] {
      return [...elemento.querySelectorAll<HTMLButtonElement>('button')].filter(
        (boton) => boton.textContent?.trim() === 'Modificar',
      );
    }

    it('ofrece modificar las pendientes y confirmadas, nunca las canceladas', () => {
      reservas.set([
        pendiente,
        { ...pendiente, id: 7, estadoReserva: 'ACEPTADA' },
        { ...pendiente, id: 8, estadoReserva: 'CANCELADA' },
      ]);
      const elemento = crearComponente().nativeElement as HTMLElement;

      expect(botonesModificar(elemento).map((b) => b.getAttribute('aria-label'))).toEqual([
        'Modificar la reserva #6',
        'Modificar la reserva #7',
      ]);
    });

    it('envía la fecha, el horario y la cantidad nuevos y cierra el formulario', async () => {
      reservas.set([pendiente]);
      modificar.mockReturnValue(
        of({ ...cancelada, cantidad: 3, fecha, estadoReserva: 'PENDIENTE' }),
      );
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;

      botonesModificar(elemento)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();

      const formulario = elemento.querySelector('form[aria-label="Modificar la reserva #6"]')!;
      const fechaInput = formulario.querySelector<HTMLInputElement>('input[type="date"]')!;
      const cantidad = formulario.querySelector<HTMLInputElement>('input[type="number"]')!;
      expect(fechaInput.value).toBe(fecha);
      expect(formulario.querySelector<HTMLSelectElement>('select')!.value).toBe('20:00');
      expect(cantidad.value).toBe('2');

      cantidad.value = '3';
      cantidad.dispatchEvent(new Event('input'));
      formulario.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(modificar).toHaveBeenCalledWith(6, {
        fechaReserva: fecha,
        horarioLlegada: '20:00',
        cantidad: 3,
        idEspacio: 3,
      });
      expect(elemento.querySelector('form[aria-label="Modificar la reserva #6"]')).toBeNull();
    });

    it('permite cambiar a otro espacio con lugar y no a uno sin lugar', async () => {
      reservas.set([pendiente]);
      modificar.mockReturnValue(of({ ...cancelada, fecha, estadoReserva: 'PENDIENTE' }));
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;

      botonesModificar(elemento)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();
      const formulario = elemento.querySelector('form[aria-label="Modificar la reserva #6"]')!;
      const radio = (valor: string) =>
        formulario.querySelector<HTMLInputElement>(`input[type="radio"][value="${valor}"]`)!;
      expect(radio('3').checked).toBe(true);
      expect(formulario.textContent).toContain('Sin lugar para esa fecha y cantidad');

      radio('4').click();
      fixture.detectChanges();
      formulario.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(modificar).not.toHaveBeenCalled();
      expect(formulario.textContent).toContain('No hay lugar en ese espacio para esa fecha y cantidad.');

      radio('5').click();
      fixture.detectChanges();
      formulario.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
      expect(modificar).toHaveBeenCalledWith(6, expect.objectContaining({ idEspacio: 5 }));
    });

    it('lleva el foco a la fecha al abrir y avisa y vuelve a "Modificar" al guardar', async () => {
      reservas.set([pendiente]);
      modificar.mockReturnValue(
        of({ ...cancelada, cantidad: 3, fecha, estadoReserva: 'PENDIENTE' }),
      );
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;
      document.body.appendChild(elemento);

      botonesModificar(elemento)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();

      const formulario = elemento.querySelector('form[aria-label="Modificar la reserva #6"]')!;
      expect(document.activeElement).toBe(formulario.querySelector('input[type="date"]'));

      formulario.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      const aviso = elemento.querySelector('[data-testid="aviso-modificacion"]');
      expect(aviso?.closest('[role="status"]')).not.toBeNull();
      expect(aviso?.textContent).toContain('Guardamos los cambios de la reserva #6.');
      expect(document.activeElement).toBe(botonesModificar(elemento)[0]);
      elemento.remove();
    });

    it('vuelve el foco a "Modificar" al cancelar la edición', async () => {
      reservas.set([pendiente]);
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;
      document.body.appendChild(elemento);

      botonesModificar(elemento)[0].click();
      fixture.detectChanges();
      await fixture.whenStable();
      [...elemento.querySelectorAll<HTMLButtonElement>('form button')]
        .find((boton) => boton.type === 'button')!
        .click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.activeElement).toBe(botonesModificar(elemento)[0]);
      expect(elemento.querySelector('[data-testid="aviso-modificacion"]')).toBeNull();
      elemento.remove();
    });

    it('no envía una cantidad menor a 1', async () => {
      reservas.set([pendiente]);
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;

      botonesModificar(elemento)[0].click();
      fixture.detectChanges();
      const formulario = elemento.querySelector('form')!;
      const cantidad = formulario.querySelector<HTMLInputElement>('input[type="number"]')!;
      cantidad.value = '0';
      cantidad.dispatchEvent(new Event('input'));
      formulario.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(modificar).not.toHaveBeenCalled();
      expect(formulario.textContent).toContain('Reservá al menos para 1 persona.');
    });

    it('muestra el error de cantidad mínima apenas el valor es inválido, sin esperar el blur', () => {
      reservas.set([pendiente]);
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;

      botonesModificar(elemento)[0].click();
      fixture.detectChanges();
      const formulario = elemento.querySelector('form')!;
      const cantidad = formulario.querySelector<HTMLInputElement>('input[type="number"]')!;
      cantidad.value = '0';
      cantidad.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(formulario.textContent).toContain('Reservá al menos para 1 persona.');
      expect(cantidad.getAttribute('aria-invalid')).toBe('true');
      expect(cantidad.getAttribute('aria-describedby')).toBe(`${cantidad.id}-error`);
    });

    it('no muestra errores de cantidad al abrir el formulario', () => {
      reservas.set([pendiente]);
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;

      botonesModificar(elemento)[0].click();
      fixture.detectChanges();
      const formulario = elemento.querySelector('form')!;

      expect(formulario.textContent).not.toContain('Reservá al menos para 1 persona.');
      expect(formulario.querySelector('input[type="number"]')!.getAttribute('aria-invalid')).toBe(
        'false',
      );
    });

    it('muestra en el formulario el mensaje de error del servidor', () => {
      reservas.set([pendiente]);
      const fixture = crearComponente();
      const elemento = fixture.nativeElement as HTMLElement;

      botonesModificar(elemento)[0].click();
      mutationError.set('No hay cupo disponible para esa fecha.');
      fixture.detectChanges();

      const alertas = elemento.querySelectorAll('[role="alert"]');
      expect(alertas).toHaveLength(1);
      expect(
        elemento.querySelector('[data-testid="error-modificacion"]')?.textContent?.trim(),
      ).toBe('No hay cupo disponible para esa fecha.');
    });
  });
});
