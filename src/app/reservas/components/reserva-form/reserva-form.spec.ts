import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReservaDetailDTO } from '../../models';
import { EspacioPublico } from '../../../restaurantes/models/espacios';
import { diaDeFecha, DIAS_SEMANA, FranjaHoraria } from '../../../restaurantes/utils/horarios';
import { EspaciosService } from '../../services/espacios.service';
import { HorariosService } from '../../services/horarios.service';
import { fechaLocal } from '../../utils/reserva-reglas';
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
    idEspacio: 3,
    espacioNombre: 'Salón principal',
  };

  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let crear: ReturnType<typeof vi.fn>;
  let espacios: EspacioPublico[];
  let listarEspacios: ReturnType<typeof vi.fn>;
  let franjas: FranjaHoraria[];

  beforeEach(async () => {
    saving = signal(false);
    mutationError = signal<string | null>(null);
    crear = vi.fn(() => of(detalle));
    espacios = [
      { id: 3, tipo: 'SALON', nombre: 'Salón principal', hayLugar: true },
      { id: 4, tipo: 'PATIO', nombre: 'Patio', hayLugar: true },
    ];
    listarEspacios = vi.fn(() => of(espacios));
    franjas = [];

    await TestBed.configureTestingModule({
      imports: [ReservaForm],
      providers: [
        { provide: EspaciosService, useValue: { listar: listarEspacios } },
        { provide: HorariosService, useValue: { listar: vi.fn(() => of(franjas)) } },
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
        idEspacio: 3,
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

  it('consulta los espacios con la fecha y cantidad elegidas y envía el espacio elegido', async () => {
    const fixture = crearComponente();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listarEspacios).toHaveBeenCalledWith(5, expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), 2);
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect([...radios].map((r) => r.value)).toEqual(['3', '4']);
    expect(radios[0].checked).toBe(true);

    radios[1].click();
    fixture.detectChanges();
    await enviar(fixture);

    expect(crear).toHaveBeenCalledWith(expect.objectContaining({ idEspacio: 4 }));
  });

  it('preselecciona un espacio con lugar y no deja reservar en uno sin lugar', async () => {
    espacios = [
      { id: 3, tipo: 'SALON', nombre: 'Salón principal', hayLugar: false },
      { id: 4, tipo: 'PATIO', nombre: 'Patio', hayLugar: true },
    ];
    const fixture = crearComponente();
    await fixture.whenStable();
    fixture.detectChanges();
    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(radios[1].checked).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Sin lugar para esa fecha y cantidad');

    radios[0].click();
    fixture.detectChanges();
    await enviar(fixture);
    fixture.detectChanges();

    expect(crear).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'No hay lugar en ese espacio para esa fecha y cantidad.',
    );
  });

  it('ofrece solo los horarios de atención de ese día y ajusta la hora elegida', async () => {
    const manana = diaDeFecha(fechaLocal(1));
    franjas = [{ dia: manana, apertura: '21:00', cierre: '23:00' }];
    const fixture = crearComponente();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const opciones = Array.from(host.querySelectorAll('#reserva-horario option')).map((o) =>
      o.textContent?.trim(),
    );
    expect(opciones).toEqual(['21:00 hs', '21:30 hs', '22:00 hs', '22:30 hs']);
    expect(host.querySelector('[data-testid="horario-del-dia"]')?.textContent).toContain(
      '21:00 a 23:00',
    );

    await enviar(fixture);
    expect(crear).toHaveBeenCalledWith(expect.objectContaining({ horarioLlegada: '21:00' }));
  });

  it('avisa que el restaurante está cerrado ese día y no deja reservar', async () => {
    const manana = diaDeFecha(fechaLocal(1));
    const otroDia = DIAS_SEMANA.find((dia) => dia !== manana)!;
    franjas = [{ dia: otroDia, apertura: '20:00', cierre: '00:00' }];
    const fixture = crearComponente();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ese día el restaurante está cerrado');
    await enviar(fixture);
    expect(crear).not.toHaveBeenCalled();
  });

  it('debería mostrar el error de escritura del servicio', () => {
    mutationError.set('No se pudo conectar con el servidor.');
    const fixture = crearComponente();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo conectar con el servidor.',
    );
  });
});
