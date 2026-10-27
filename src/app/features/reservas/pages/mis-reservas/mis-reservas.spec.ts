import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ReservaDetailDTO, ReservaListDTO } from '../../models';
import { ReservaService } from '../../services/reserva.service';
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
    },
    {
      id: 7,
      cantidad: 4,
      fechaReserva: '2026-11-22T15:00:00.000+00:00',
      horariollegada: '21:30:00',
      estadoReserva: 'ACEPTADA',
      nombreResto: 'La Trattoria',
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
  };

  let reservas: WritableSignal<ReservaListDTO[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let listarPorUsuario: ReturnType<typeof vi.fn>;
  let cancelar: ReturnType<typeof vi.fn>;
  let limpiarErrorMutacion: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    reservas = signal(reservasMock);
    cargando = signal(false);
    error = signal<string | null>(null);
    saving = signal(false);
    mutationError = signal<string | null>(null);
    listarPorUsuario = vi.fn(() => of(reservas()));
    cancelar = vi.fn(() => of(cancelada));
    limpiarErrorMutacion = vi.fn();

    await TestBed.configureTestingModule({
      imports: [MisReservas],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { userId: vi.fn(() => 29) },
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
});
