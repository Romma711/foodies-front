import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { I18n } from '@core/i18n/i18n.service';
import { EntidadCliente, MovimientoStrike } from '../../models/entidades-admin';
import { AdminEntidadesService } from '../../services/admin-entidades.service';
import { ErrorAdmin } from '../../services/mensaje-error-admin';
import { StrikeHistorial } from './strike-historial';

const ANA: EntidadCliente = {
  id: 4,
  nombre: 'Ana',
  apellido: 'Gómez',
  email: 'ana@mail.com',
  telefono: '2231111111',
  strikes: 2,
  activo: true,
  fechaRegistro: null,
};

const MOVIMIENTOS: MovimientoStrike[] = [
  {
    id: 2,
    fecha: '2026-11-25T10:30:00',
    tipo: 'SUMA',
    origen: 'AUSENCIAS',
    motivo: '3 ausencias sin aviso',
    totalDespues: 2,
  },
  {
    id: 1,
    fecha: '2026-11-20T18:05:00',
    tipo: 'SUMA',
    origen: 'ADMIN',
    motivo: 'Lenguaje ofensivo en una reseña',
    totalDespues: 1,
  },
];

describe('StrikeHistorial', () => {
  let clientes: WritableSignal<EntidadCliente[]>;
  let servicio: {
    historialStrikes: ReturnType<typeof vi.fn>;
    quitarStrike: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    clientes = signal([ANA]);
    servicio = {
      historialStrikes: vi.fn(() => of(MOVIMIENTOS)),
      quitarStrike: vi.fn((tipo: string, id: number) => {
        clientes.update((lista) =>
          lista.map((c) => (c.id === id ? { ...c, strikes: c.strikes - 1 } : c)),
        );
        return of({ strikes: 1 });
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AdminEntidadesService,
          useValue: {
            ...servicio,
            clientes: clientes.asReadonly(),
            restaurantes: signal([]).asReadonly(),
          },
        },
      ],
    });
  });

  afterEach(() => TestBed.inject(I18n).usar('es'));

  function crear() {
    const fixture = TestBed.createComponent(StrikeHistorial);
    fixture.detectChanges();
    fixture.componentInstance.abrir({ tipo: 'cliente', id: 4, nombre: 'Ana Gómez' });
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  function boton(host: HTMLElement, texto: string): HTMLButtonElement | undefined {
    return Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto);
  }

  function quitar(fixture: { detectChanges(): void }, host: HTMLElement, motivo: string) {
    const area = host.querySelector<HTMLTextAreaElement>('textarea')!;
    area.value = motivo;
    area.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    boton(host, 'Quitar un strike')!.click();
    fixture.detectChanges();
  }

  it('abre el diálogo con el historial del cliente, del más nuevo al más viejo', () => {
    const { host } = crear();

    expect(servicio.historialStrikes).toHaveBeenCalledWith('cliente', 4);
    expect(host.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(host.querySelector('h2')?.textContent).toContain('Historial de strikes de Ana Gómez');
    expect(host.querySelector('[data-testid="strikes-actuales"]')?.textContent).toContain('2');
    const filas = host.querySelectorAll('[data-testid="movimiento"]');
    expect(filas.length).toBe(2);
    expect(filas[0].textContent).toContain('Agregado');
    expect(filas[0].textContent).toContain('Automático: 3 ausencias');
    expect(filas[0].textContent).toContain('3 ausencias sin aviso');
    expect(filas[0].textContent).toContain('10:30');
    expect(filas[1].textContent).toContain('Por el admin');
    expect(filas[1].textContent).toContain('Lenguaje ofensivo en una reseña');
  });

  it('traduce el historial al idioma elegido', () => {
    const { fixture, host } = crear();

    TestBed.inject(I18n).usar('en');
    fixture.detectChanges();

    const filas = host.querySelectorAll('[data-testid="movimiento"]');
    expect(filas[0].textContent).toContain('Added');
    expect(filas[0].textContent).toContain('Automatic: 3 no-shows');
    expect(filas[1].textContent).toContain('By the admin');
  });

  it('muestra un texto cuando todavía no hay movimientos', () => {
    servicio.historialStrikes.mockReturnValue(of([]));
    const { host } = crear();

    expect(host.textContent).toContain('Todavía no tiene movimientos de strikes.');
  });

  it('si el historial no carga muestra el error', () => {
    servicio.historialStrikes.mockReturnValue(
      throwError(() => new ErrorAdmin({ clave: 'admin.error.historialStrikes' })),
    );
    const { host } = crear();

    expect(host.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'No se pudo cargar el historial de strikes.',
    );
  });

  it('pide el motivo antes de quitar un strike', () => {
    const { fixture, host } = crear();

    quitar(fixture, host, '   ');

    expect(servicio.quitarStrike).not.toHaveBeenCalled();
    expect(host.querySelector('textarea')?.getAttribute('aria-invalid')).toBe('true');
    expect(host.textContent).toContain('Escribí el motivo para quitar el strike.');
  });

  it('quita el strike con el motivo y refresca el total y el historial', () => {
    const { fixture, host } = crear();
    servicio.historialStrikes.mockReturnValue(
      of([
        {
          id: 3,
          fecha: '2026-11-25T11:00:00',
          tipo: 'QUITA',
          origen: 'ADMIN',
          motivo: 'Las ausencias fueron por un corte de luz',
          totalDespues: 1,
        },
        ...MOVIMIENTOS,
      ]),
    );

    quitar(fixture, host, 'Las ausencias fueron por un corte de luz');

    expect(servicio.quitarStrike).toHaveBeenCalledWith(
      'cliente',
      4,
      'Las ausencias fueron por un corte de luz',
    );
    expect(servicio.historialStrikes).toHaveBeenCalledTimes(2);
    expect(host.querySelector('[data-testid="strikes-actuales"]')?.textContent).toContain('1');
    const filas = host.querySelectorAll('[data-testid="movimiento"]');
    expect(filas.length).toBe(3);
    expect(filas[0].textContent).toContain('Quitado');
    expect(host.querySelector('[role="status"]')?.textContent).toContain(
      'Strike quitado. Ahora tiene 1.',
    );
    expect(host.querySelector('textarea')?.value).toBe('');
  });

  it('mientras quita deshabilita el botón', () => {
    const pedido = new Subject<{ strikes: number }>();
    servicio.quitarStrike.mockReturnValue(pedido);
    const { fixture, host } = crear();

    quitar(fixture, host, 'Fue un error');

    expect(boton(host, 'Quitando…')?.disabled).toBe(true);
  });

  it('con 0 strikes no ofrece quitar', () => {
    clientes.set([{ ...ANA, strikes: 0 }]);
    const { host } = crear();

    expect(boton(host, 'Quitar un strike')).toBeUndefined();
    expect(host.querySelector('textarea')).toBeNull();
    expect(host.textContent).toContain('No tiene strikes para quitar.');
  });

  it('muestra traducido el error del backend al quitar', () => {
    servicio.quitarStrike.mockReturnValue(
      throwError(
        () =>
          new ErrorAdmin({
            codigo: 'errores.SIN_STRIKES',
            params: {},
            texto: 'No tiene strikes para quitar.',
          }),
      ),
    );
    const { fixture, host } = crear();

    quitar(fixture, host, 'Motivo');
    TestBed.inject(I18n).usar('pt');
    fixture.detectChanges();

    expect(host.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Esta conta não tem strikes para remover.',
    );
  });

  it('el botón Cerrar cierra el diálogo', () => {
    const { fixture, host } = crear();

    boton(host, 'Cerrar')!.click();
    fixture.detectChanges();

    expect(host.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });
});
