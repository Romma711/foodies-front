import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEVER, of, Subject, throwError } from 'rxjs';
import { SolicitudRestaurante } from '../../models/entidades-admin';
import { AdminSolicitudesService } from '../../services/admin-solicitudes.service';
import { SolicitudesRestaurantes } from './solicitudes-restaurantes';

const PASTA: SolicitudRestaurante = {
  restaurantId: 7,
  nombre: 'Pasta Nostra',
  ubicacion: 'Av. Colón 1200',
  especialidad: 'PASTAS',
  cupoMaximo: 40,
  estado: 'PENDIENTE',
  usuarioId: 12,
  email: 'pasta@mail.com',
  telefono: '2234000000',
  fechaRegistro: '2026-10-28T10:15:00',
};

describe('SolicitudesRestaurantes', () => {
  let solicitudes: WritableSignal<SolicitudRestaurante[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let servicio: {
    cargar: ReturnType<typeof vi.fn>;
    aprobar: ReturnType<typeof vi.fn>;
    rechazar: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    solicitudes = signal([PASTA]);
    cargando = signal(false);
    error = signal<string | null>(null);
    servicio = {
      cargar: vi.fn(() => of([])),
      aprobar: vi.fn(() => of({ restaurantId: 7, nombre: 'Pasta Nostra', estado: 'APROBADO' })),
      rechazar: vi.fn(() => of({ restaurantId: 7, nombre: 'Pasta Nostra', estado: 'RECHAZADO' })),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AdminSolicitudesService,
          useValue: {
            ...servicio,
            solicitudes: solicitudes.asReadonly(),
            cargando: cargando.asReadonly(),
            error: error.asReadonly(),
          },
        },
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(SolicitudesRestaurantes);
    fixture.detectChanges();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  function boton(host: HTMLElement, texto: string): HTMLButtonElement {
    const encontrado = Array.from(host.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === texto,
    );
    expect(encontrado, `botón "${texto}"`).toBeDefined();
    return encontrado!;
  }

  it('muestra cada solicitud con los datos de contacto del encargado', () => {
    const { host } = crear();

    expect(servicio.cargar).toHaveBeenCalledTimes(1);
    const tarjeta = host.querySelector('[data-testid="solicitud"]');
    expect(tarjeta?.querySelector('h2')?.textContent?.trim()).toBe('Pasta Nostra');
    expect(tarjeta?.textContent).toContain('Pastas');
    expect(tarjeta?.textContent).toContain('Av. Colón 1200');
    expect(tarjeta?.textContent).toContain('40 personas');
    expect(tarjeta?.textContent).toContain('pasta@mail.com');
    expect(tarjeta?.textContent).toContain('2234000000');
  });

  it('aprueba y avisa con un toast', () => {
    const { fixture, host } = crear();

    boton(host, 'Aprobar').click();
    fixture.detectChanges();

    expect(servicio.aprobar).toHaveBeenCalledWith(7);
    expect(host.textContent).toContain('Pasta Nostra fue aprobado y ya aparece en el catálogo.');
  });

  it('pide confirmación antes de rechazar', () => {
    const { fixture, host } = crear();

    boton(host, 'Rechazar').click();
    fixture.detectChanges();
    expect(servicio.rechazar).not.toHaveBeenCalled();
    expect(host.textContent).toContain('¿Rechazar la solicitud?');

    boton(host, 'Confirmar rechazo').click();
    fixture.detectChanges();

    expect(servicio.rechazar).toHaveBeenCalledWith(7);
    expect(host.textContent).toContain('Se rechazó la solicitud de Pasta Nostra.');
  });

  it('cancelar el rechazo vuelve a los botones originales', () => {
    const { fixture, host } = crear();

    boton(host, 'Rechazar').click();
    fixture.detectChanges();
    boton(host, 'Cancelar').click();
    fixture.detectChanges();

    expect(servicio.rechazar).not.toHaveBeenCalled();
    expect(boton(host, 'Aprobar')).toBeTruthy();
  });

  it('muestra el error de la acción sin sacar la solicitud', () => {
    servicio.aprobar.mockReturnValue(
      throwError(() => new Error('No se pudo aprobar la solicitud.')),
    );
    const { fixture, host } = crear();

    boton(host, 'Aprobar').click();
    fixture.detectChanges();

    expect(host.textContent).toContain('No se pudo aprobar la solicitud.');
    expect(host.querySelectorAll('[data-testid="solicitud"]')).toHaveLength(1);
  });

  it('deshabilita los botones mientras se resuelve una solicitud', () => {
    servicio.aprobar.mockReturnValue(NEVER);
    const { fixture, host } = crear();

    boton(host, 'Aprobar').click();
    fixture.detectChanges();

    expect(boton(host, 'Aprobando…').disabled).toBe(true);
    expect(boton(host, 'Rechazar').disabled).toBe(true);
  });

  it('muestra un estado vacío cuando no hay solicitudes', () => {
    solicitudes.set([]);
    const { host } = crear();

    expect(host.textContent).toContain('No hay solicitudes pendientes');
  });

  it('muestra el error de carga con un botón para reintentar', () => {
    solicitudes.set([]);
    error.set('No se pudieron cargar las solicitudes.');
    const { fixture, host } = crear();

    expect(host.textContent).toContain('No se pudieron cargar las solicitudes.');
    boton(host, 'Reintentar').click();
    fixture.detectChanges();
    expect(servicio.cargar).toHaveBeenCalledTimes(2);
  });

  it('cada solicitud queda bloqueada hasta que termina su propio pedido', () => {
    const SUSHI: SolicitudRestaurante = { ...PASTA, restaurantId: 8, nombre: 'Sushi del Puerto' };
    solicitudes.set([PASTA, SUSHI]);
    const pedidos = new Map<number, Subject<unknown>>();
    servicio.aprobar.mockImplementation((id: number) => {
      const pedido = new Subject<unknown>();
      pedidos.set(id, pedido);
      return pedido;
    });
    const { fixture, host } = crear();
    const aprobar = (nombre: string) =>
      host.querySelector<HTMLButtonElement>(`button[aria-label="Aprobar ${nombre}"]`)!;

    aprobar('Pasta Nostra').click();
    aprobar('Sushi del Puerto').click();
    fixture.detectChanges();
    expect(aprobar('Pasta Nostra').disabled).toBe(true);
    expect(aprobar('Sushi del Puerto').disabled).toBe(true);

    pedidos.get(7)!.next({});
    pedidos.get(7)!.complete();
    fixture.detectChanges();

    expect(aprobar('Sushi del Puerto').disabled).toBe(true);
    expect(aprobar('Sushi del Puerto').textContent?.trim()).toBe('Aprobando…');
    aprobar('Sushi del Puerto').click();
    expect(servicio.aprobar).toHaveBeenCalledTimes(2);
  });

  it('terminar una solicitud no cierra la confirmación de rechazo de otra', () => {
    const SUSHI: SolicitudRestaurante = { ...PASTA, restaurantId: 8, nombre: 'Sushi del Puerto' };
    solicitudes.set([PASTA, SUSHI]);
    const pedido = new Subject<unknown>();
    servicio.aprobar.mockReturnValue(pedido);
    const { fixture, host } = crear();

    host.querySelector<HTMLButtonElement>('button[aria-label="Aprobar Pasta Nostra"]')!.click();
    host
      .querySelector<HTMLButtonElement>('button[aria-label="Rechazar Sushi del Puerto"]')!
      .click();
    fixture.detectChanges();
    pedido.next({});
    pedido.complete();
    fixture.detectChanges();

    expect(boton(host, 'Confirmar rechazo')).toBeDefined();
  });
});
