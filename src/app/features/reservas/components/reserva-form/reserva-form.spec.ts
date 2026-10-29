import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReservaDetailDTO } from '../../models';
import { ReservaService } from '../../services/reserva.service';
import { ReservaForm } from './reserva-form';

describe('ReservaForm', () => {
  const detalle: ReservaDetailDTO = {
    id: 6,
    cantidad: 2,
    fecha: '2026-11-20T15:00:00.000+00:00',
    horariollegada: '20:00:00',
    estadoReserva: 'PENDIENTE',
    nombreUsuario: 'Demo',
    nombreResto: 'Ochiwan',
  };

  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let crear: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    saving = signal(false);
    mutationError = signal<string | null>(null);
    crear = vi.fn(() => of(detalle));

    await TestBed.configureTestingModule({
      imports: [ReservaForm],
      providers: [
        {
          provide: ReservaService,
          useValue: {
            saving: saving.asReadonly(),
            mutationError: mutationError.asReadonly(),
            crear,
          },
        },
      ],
    }).compileComponents();
  });

  function crearComponente() {
    const fixture = TestBed.createComponent(ReservaForm);
    fixture.componentRef.setInput('restauranteId', 5);
    fixture.componentRef.setInput('usuarioId', 29);
    fixture.detectChanges();
    return fixture;
  }

  async function enviar(fixture: ReturnType<typeof crearComponente>): Promise<void> {
    const component = fixture.componentInstance as unknown as {
      onSubmit(event: Event): Promise<void>;
    };
    await component.onSubmit(new Event('submit'));
  }

  it('debería enviar la reserva con los datos del formulario', async () => {
    const fixture = crearComponente();
    const emitida = vi.fn();
    fixture.componentInstance.creada.subscribe(emitida);

    await enviar(fixture);

    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({
        cantidad: 2,
        horarioLlegada: '20:00',
        idUsuario: 29,
        idRestaurant: 5,
      }),
    );
    expect(crear).toHaveBeenCalledWith(
      expect.objectContaining({ fechaReserva: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
    );
    expect(emitida).toHaveBeenCalledWith(detalle);
  });

  it('no debería mostrar la capacidad y deja que el backend decida si hay lugar', async () => {
    const fixture = crearComponente();
    const input = fixture.nativeElement.querySelector('#reserva-cantidad') as HTMLInputElement;

    expect(fixture.nativeElement.textContent).not.toMatch(/capacidad|cupo/i);

    input.value = '20';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await enviar(fixture);

    expect(crear).toHaveBeenCalledWith(expect.objectContaining({ cantidad: 20 }));
  });

  it('debería mostrar el error de escritura del servicio', () => {
    mutationError.set('No se pudo conectar con el servidor.');
    const fixture = crearComponente();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo conectar con el servidor.',
    );
  });
});
