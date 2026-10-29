import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EntidadCliente, EntidadRestaurante } from '../../models/entidades-admin';
import { AdminEntidadesService } from '../../services/admin-entidades.service';
import { GestionEntidades } from './gestion-entidades';

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
const OCHIWAN: EntidadRestaurante = {
  id: 2,
  nombre: 'Ochiwan',
  ubicacion: 'San Juan 229',
  especialidad: 'ASIATICA',
  estado: 'APROBADO',
  strikes: 0,
  activo: false,
  usuarioId: 9,
  email: 'ochiwan@mail.com',
};

describe('GestionEntidades', () => {
  let clientes: WritableSignal<EntidadCliente[]>;
  let restaurantes: WritableSignal<EntidadRestaurante[]>;
  let servicio: {
    cargar: ReturnType<typeof vi.fn>;
    cambiarActivoCliente: ReturnType<typeof vi.fn>;
    cambiarActivoRestaurante: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    clientes = signal([ANA]);
    restaurantes = signal([OCHIWAN]);
    servicio = {
      cargar: vi.fn(() => of(undefined)),
      cambiarActivoCliente: vi.fn((id: number, activo: boolean) => {
        clientes.update((lista) => lista.map((c) => (c.id === id ? { ...c, activo } : c)));
        return of({ id, nombre: 'Ana', activo });
      }),
      cambiarActivoRestaurante: vi.fn((id: number, activo: boolean) =>
        of({ id, nombre: 'Ochiwan', activo }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AdminEntidadesService,
          useValue: {
            ...servicio,
            clientes: clientes.asReadonly(),
            restaurantes: restaurantes.asReadonly(),
            cargando: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
          },
        },
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(GestionEntidades);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  function pestana(host: HTMLElement, nombre: string): HTMLButtonElement {
    return Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find((tab) =>
      tab.textContent?.includes(nombre),
    )!;
  }

  it('arranca en la pestaña de clientes con sus strikes y estado', () => {
    const { host } = crear();

    expect(servicio.cargar).toHaveBeenCalledTimes(1);
    expect(pestana(host, 'Clientes').getAttribute('aria-selected')).toBe('true');
    const fila = host.querySelector('tbody tr');
    expect(fila?.textContent).toContain('Ana Gómez');
    expect(fila?.textContent).toContain('ana@mail.com');
    expect(fila?.querySelector('[data-testid="strikes"]')?.textContent?.trim()).toBe('2');
    const interruptor = fila?.querySelector('[role="switch"]');
    expect(interruptor?.getAttribute('aria-checked')).toBe('true');
    expect(interruptor?.getAttribute('aria-label')).toBe('Cuenta activa de Ana Gómez');
  });

  it('cambia a la pestaña de restaurantes', () => {
    const { fixture, host } = crear();

    pestana(host, 'Restaurantes').click();
    fixture.detectChanges();

    expect(pestana(host, 'Restaurantes').getAttribute('aria-selected')).toBe('true');
    const fila = host.querySelector('tbody tr');
    expect(fila?.textContent).toContain('Ochiwan');
    expect(fila?.textContent).toContain('Aprobado');
    expect(fila?.textContent).toContain('ochiwan@mail.com');
    expect(fila?.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('false');
  });

  it('da de baja un cliente desde su interruptor y lo confirma con un toast', () => {
    const { fixture, host } = crear();

    host.querySelector<HTMLButtonElement>('tbody [role="switch"]')!.click();
    fixture.detectChanges();

    expect(servicio.cambiarActivoCliente).toHaveBeenCalledWith(4, false);
    expect(host.querySelector('tbody [role="switch"]')?.getAttribute('aria-checked')).toBe('false');
    expect(host.textContent).toContain('Ana Gómez fue dado de baja.');
  });

  it('reactiva un restaurante dado de baja', () => {
    const { fixture, host } = crear();
    pestana(host, 'Restaurantes').click();
    fixture.detectChanges();

    host.querySelector<HTMLButtonElement>('tbody [role="switch"]')!.click();
    fixture.detectChanges();

    expect(servicio.cambiarActivoRestaurante).toHaveBeenCalledWith(2, true);
    expect(host.textContent).toContain('Ochiwan fue reactivado.');
  });

  it('muestra el error si no se pudo cambiar el estado', () => {
    servicio.cambiarActivoCliente.mockReturnValue(
      throwError(() => new Error('No se puede dar de baja a un administrador')),
    );
    const { fixture, host } = crear();

    host.querySelector<HTMLButtonElement>('tbody [role="switch"]')!.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('No se puede dar de baja a un administrador');
    expect(host.querySelector('tbody [role="switch"]')?.getAttribute('aria-checked')).toBe('true');
  });

  it('cada interruptor queda deshabilitado hasta que termina su propio pedido', () => {
    const LUIS: EntidadCliente = {
      ...ANA,
      id: 5,
      nombre: 'Luis',
      apellido: 'Paz',
      email: 'luis@mail.com',
    };
    clientes.set([ANA, LUIS]);
    const pedidos = new Map<number, Subject<unknown>>();
    servicio.cambiarActivoCliente.mockImplementation((id: number) => {
      const pedido = new Subject<unknown>();
      pedidos.set(id, pedido);
      return pedido;
    });
    const { fixture, host } = crear();
    const interruptores = () => host.querySelectorAll<HTMLButtonElement>('tbody [role="switch"]');

    interruptores()[0].click();
    interruptores()[1].click();
    fixture.detectChanges();
    expect([...interruptores()].map((boton) => boton.disabled)).toEqual([true, true]);

    pedidos.get(4)!.next({});
    pedidos.get(4)!.complete();
    fixture.detectChanges();

    expect([...interruptores()].map((boton) => boton.disabled)).toEqual([false, true]);
    interruptores()[1].click();
    expect(servicio.cambiarActivoCliente).toHaveBeenCalledTimes(2);
  });

  it('las pestañas se recorren con las flechas del teclado', () => {
    const { fixture, host } = crear();
    document.body.appendChild(host);

    pestana(host, 'Clientes').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();

    expect(pestana(host, 'Restaurantes').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(pestana(host, 'Restaurantes'));
  });
});
