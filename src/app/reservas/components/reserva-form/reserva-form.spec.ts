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
import { DisponibilidadService } from '../../services/disponibilidad.service';
import { Disponibilidad } from '../../models/disponibilidad';
import { ListaEsperaService } from '../../../lista-espera/services/lista-espera.service';
import { Mensaje } from '../../../core/i18n/traducir';
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
    idTurno: null,
  };

  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let crear: ReturnType<typeof vi.fn>;
  let espacios: EspacioPublico[];
  let listarEspacios: ReturnType<typeof vi.fn>;
  let franjas: FranjaHoraria[];
  let disponibilidad: Disponibilidad;
  let anotar: ReturnType<typeof vi.fn>;
  let errorLista: WritableSignal<Mensaje | null>;

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
    disponibilidad = { fecha: fechaLocal(1), porTurnos: false, turnos: [] };
    anotar = vi.fn(() => of({ id: 1 }));
    errorLista = signal<Mensaje | null>(null);

    await TestBed.configureTestingModule({
      imports: [ReservaForm],
      providers: [
        { provide: EspaciosService, useValue: { listar: listarEspacios } },
        { provide: HorariosService, useValue: { listar: vi.fn(() => of(franjas)) } },
        {
          provide: DisponibilidadService,
          useValue: { consultar: vi.fn(() => of(disponibilidad)) },
        },
        {
          provide: ListaEsperaService,
          useValue: { saving: signal(false), error: errorLista.asReadonly(), anotar },
        },
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
    // Rule D11: the last arrival is 60 minutes before closing.
    expect(opciones).toEqual(['21:00 hs', '21:30 hs', '22:00 hs']);
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

  describe('con turnos (RF24) y lista de espera (RF25)', () => {
    function conTurnos(): void {
      disponibilidad = {
        fecha: fechaLocal(1),
        porTurnos: true,
        turnos: [
          {
            idTurno: 11,
            inicio: '20:00',
            fin: '21:30',
            espacios: [
              { idEspacio: 3, nombre: 'Salón principal', tipo: 'SALON', libres: 0 },
              { idEspacio: 4, nombre: 'Patio', tipo: 'PATIO', libres: 1 },
            ],
          },
          {
            idTurno: 12,
            inicio: '21:30',
            fin: '23:00',
            espacios: [
              { idEspacio: 3, nombre: 'Salón principal', tipo: 'SALON', libres: 12 },
              { idEspacio: 4, nombre: 'Patio', tipo: 'PATIO', libres: 0 },
            ],
          },
        ],
      };
    }

    async function renderizar() {
      const fixture = crearComponente();
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    }

    function turno(host: HTMLElement, id: number): HTMLElement {
      return host.querySelector(`[data-turno="${id}"]`) as HTMLElement;
    }

    it('muestra los turnos con los lugares libres por espacio en lugar del horario', async () => {
      conTurnos();
      const host = (await renderizar()).nativeElement as HTMLElement;

      expect(host.querySelector('#reserva-horario')).toBeNull();
      expect(turno(host, 11).textContent).toContain('20:00 a 21:30');
      expect(turno(host, 11).textContent).toContain('Salón principal: completo · Patio: 1 lugar');
      expect(turno(host, 12).textContent).toContain(
        'Salón principal: 12 lugares · Patio: completo',
      );
    });

    it('deshabilita el turno lleno para la cantidad elegida y ofrece la lista de espera', async () => {
      conTurnos();
      const host = (await renderizar()).nativeElement as HTMLElement;

      const lleno = turno(host, 11);
      expect(lleno.querySelector<HTMLInputElement>('input[type="radio"]')!.disabled).toBe(true);
      expect(lleno.textContent).toContain('Completo');
      expect(lleno.textContent).toContain('Sumarme a la lista de espera');
      const libre = turno(host, 12);
      expect(libre.querySelector<HTMLInputElement>('input[type="radio"]')!.disabled).toBe(false);
      expect(libre.querySelector<HTMLInputElement>('input[type="radio"]')!.checked).toBe(true);
      expect(libre.textContent).not.toContain('Sumarme a la lista de espera');
    });

    it('envía el turno elegido y su hora de inicio como llegada', async () => {
      conTurnos();
      const fixture = await renderizar();

      await enviar(fixture);

      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ idTurno: 12, horarioLlegada: '21:30', idEspacio: 3 }),
      );
    });

    it('avisa cuando ese día no quedan turnos y no deja reservar', async () => {
      conTurnos();
      disponibilidad = { ...disponibilidad, turnos: [] };
      const fixture = await renderizar();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[data-testid="sin-turnos"]')
          ?.textContent,
      ).toContain('Ese día no quedan turnos disponibles');
      await enviar(fixture);
      expect(crear).not.toHaveBeenCalled();
    });

    it('anota al cliente en la lista de espera del turno lleno y lo confirma', async () => {
      conTurnos();
      const fixture = await renderizar();
      const host = fixture.nativeElement as HTMLElement;

      turno(host, 11).querySelector<HTMLButtonElement>('button')!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(anotar).toHaveBeenCalledWith({
        idRestaurant: 5,
        fechaReserva: fechaLocal(1),
        horarioLlegada: '20:00',
        idTurno: 11,
        cantidad: 2,
      });
      expect(host.querySelector('[data-testid="aviso-lista"]')?.textContent).toContain(
        'Te anotamos en la lista de espera de las 20:00',
      );
    });

    it('muestra tal cual el mensaje del servidor cuando no puede anotarlo', async () => {
      conTurnos();
      errorLista.set({ texto: 'Hay lugar en ese horario: reservá directamente' });
      const host = (await renderizar()).nativeElement as HTMLElement;

      expect(host.querySelector('[data-testid="error-lista"]')?.textContent).toContain(
        'Hay lugar en ese horario: reservá directamente',
      );
    });

    it('sin turnos ofrece la lista de espera cuando ningún espacio tiene lugar', async () => {
      espacios = [
        { id: 3, tipo: 'SALON', nombre: 'Salón principal', hayLugar: false },
        { id: 4, tipo: 'PATIO', nombre: 'Patio', hayLugar: false },
      ];
      const fixture = await renderizar();
      const host = fixture.nativeElement as HTMLElement;
      const aviso = host.querySelector('[data-testid="dia-completo"]') as HTMLElement;

      expect(aviso.textContent).toContain('No hay lugar para esa fecha y cantidad');
      aviso.querySelector('button')!.click();

      expect(anotar).toHaveBeenCalledWith(
        expect.objectContaining({ idTurno: null, horarioLlegada: '20:00', cantidad: 2 }),
      );
    });
  });
});
