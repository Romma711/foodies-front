import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResenaModeracion } from '../../models/resena-moderacion';
import { AdminModeracionService } from '../../services/admin-moderacion.service';
import { ModeracionResenas } from './moderacion-resenas';

describe('ModeracionResenas', () => {
  const resenas: ResenaModeracion[] = [
    {
      id: 9,
      comentario: 'Muy rico todo',
      calificacion: 5,
      nombreUsuario: 'Ana Gómez',
      restauranteId: 5,
      nombreRestaurante: 'Ochiwan',
    },
    {
      id: 8,
      comentario: 'Regular',
      calificacion: 2,
      nombreUsuario: '',
      restauranteId: 3,
      nombreRestaurante: 'La Casona',
    },
  ];

  let lista: WritableSignal<ResenaModeracion[]>;
  let cargando: WritableSignal<boolean>;
  let error: WritableSignal<string | null>;
  let cargar: ReturnType<typeof vi.fn>;
  let cargarMas: ReturnType<typeof vi.fn>;
  let eliminar: ReturnType<typeof vi.fn>;
  let hayMas: WritableSignal<boolean>;

  beforeEach(async () => {
    lista = signal<ResenaModeracion[]>([]);
    cargando = signal(false);
    error = signal<string | null>(null);
    cargar = vi.fn(() => of(resenas));
    cargarMas = vi.fn(() => of([]));
    hayMas = signal(false);
    eliminar = vi.fn(() => of(undefined));

    await TestBed.configureTestingModule({
      imports: [ModeracionResenas],
      providers: [
        provideRouter([]),
        {
          provide: AdminModeracionService,
          useValue: {
            resenas: lista.asReadonly(),
            cargando: cargando.asReadonly(),
            error: error.asReadonly(),
            hayMas: hayMas.asReadonly(),
            cargar,
            cargarMas,
            eliminar,
            listarRestaurantes: vi.fn(() =>
              of([
                { id: 3, nombre: 'La Casona' },
                { id: 5, nombre: 'Ochiwan' },
              ]),
            ),
          },
        },
      ],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(ModeracionResenas);
    fixture.detectChanges();
    return fixture;
  }

  function filas(fixture: ReturnType<typeof crear>) {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'),
    ) as HTMLTableRowElement[];
  }

  function boton(raiz: ParentNode, texto: string) {
    return Array.from(raiz.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === texto,
    ) as HTMLButtonElement | undefined;
  }

  it('debería pedir las reseñas recientes al entrar', () => {
    crear();

    expect(cargar).toHaveBeenCalledTimes(1);
  });

  it('debería listar cada reseña con autor y link al restaurante', () => {
    lista.set(resenas);
    const fixture = crear();
    const [primera, segunda] = filas(fixture);

    expect(filas(fixture).length).toBe(2);
    expect(primera.textContent).toContain('Muy rico todo');
    expect(primera.textContent).toContain('Ana Gómez');
    expect(primera.querySelector('a')?.getAttribute('href')).toBe('/restaurantes/5');
    expect(primera.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain('5.0');
    expect(segunda.textContent).toContain('Anónimo');
  });

  it('debería pedir confirmación antes de eliminar', async () => {
    lista.set(resenas);
    const fixture = crear();
    const fila = filas(fixture)[0];

    boton(fila, 'Eliminar')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(eliminar).not.toHaveBeenCalled();
    expect(fila.textContent).toContain('¿Eliminar?');
    expect(document.activeElement).toBe(boton(fila, 'Cancelar'));

    boton(fila, 'Confirmar')?.click();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalledWith(9);
    expect(fixture.nativeElement.querySelector('[data-testid="toast"]')?.textContent).toContain(
      'Reseña eliminada.',
    );
  });

  it('debería poder cancelar la confirmación', () => {
    lista.set(resenas);
    const fixture = crear();
    const fila = filas(fixture)[0];

    boton(fila, 'Eliminar')?.click();
    fixture.detectChanges();
    boton(fila, 'Cancelar')?.click();
    fixture.detectChanges();

    expect(eliminar).not.toHaveBeenCalled();
    expect(fila.textContent).not.toContain('¿Eliminar?');
  });

  it('debería avisar con un toast de error si el borrado falla', () => {
    lista.set(resenas);
    eliminar.mockReturnValue(throwError(() => new Error('La reseña ya no existe.')));
    const fixture = crear();
    const fila = filas(fixture)[0];

    boton(fila, 'Eliminar')?.click();
    fixture.detectChanges();
    boton(fila, 'Confirmar')?.click();
    fixture.detectChanges();

    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alerta.textContent).toContain('La reseña ya no existe.');
  });

  it('debería mostrar el estado vacío', () => {
    const fixture = crear();

    expect(fixture.nativeElement.textContent).toContain('No hay reseñas para moderar');
  });

  it('debería mostrar skeletons mientras carga', () => {
    cargando.set(true);
    const fixture = crear();
    const carga = fixture.nativeElement.querySelector('[data-testid="moderacion-cargando"]');

    expect(carga?.getAttribute('role')).toBe('status');
    expect(carga?.textContent).toContain('Cargando reseñas…');
  });

  it('debería mostrar el error de carga y permitir reintentar', () => {
    error.set('No se pudo conectar con el servidor.');
    const fixture = crear();
    const alerta = fixture.nativeElement.querySelector(
      '[data-testid="moderacion-error"]',
    ) as HTMLElement;

    expect(alerta.textContent).toContain('No se pudo conectar con el servidor.');
    boton(alerta, 'Reintentar')?.click();

    expect(cargar).toHaveBeenCalledTimes(2);
  });

  describe('filtros', () => {
    const elegir = (fixture: ReturnType<typeof crear>, id: string, valor: string) => {
      const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(`#${id}`)!;
      select.value = valor;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };

    it('debería pedir sin filtros al entrar y ofrecer los restaurantes', () => {
      const fixture = crear();

      expect(cargar).toHaveBeenCalledWith({ texto: '', calificacion: null, restauranteId: null });
      const opciones = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('#filtro-resenas-restaurante option'),
      ).map((o) => o.textContent?.trim());
      expect(opciones).toEqual(['Todos', 'La Casona', 'Ochiwan']);
    });

    it('debería buscar el texto al enviar y combinarlo con calificación y restaurante', () => {
      const fixture = crear();
      const host = fixture.nativeElement as HTMLElement;
      const input = host.querySelector<HTMLInputElement>('#filtro-resenas-texto')!;

      input.value = 'sushi';
      input.dispatchEvent(new Event('input'));
      expect(cargar).toHaveBeenCalledTimes(1);
      host.querySelector('form')!.dispatchEvent(new Event('submit'));
      expect(cargar).toHaveBeenLastCalledWith({ texto: 'sushi', calificacion: null, restauranteId: null });

      elegir(fixture, 'filtro-resenas-calificacion', '1');
      expect(cargar).toHaveBeenLastCalledWith({ texto: 'sushi', calificacion: 1, restauranteId: null });

      elegir(fixture, 'filtro-resenas-restaurante', '5');
      expect(cargar).toHaveBeenLastCalledWith({ texto: 'sushi', calificacion: 1, restauranteId: 5 });
    });

    it('debería avisar cuando nada coincide y limpiar los filtros', () => {
      cargar.mockReturnValue(of([]));
      const fixture = crear();
      elegir(fixture, 'filtro-resenas-calificacion', '3');
      const host = fixture.nativeElement as HTMLElement;

      expect(host.textContent).toContain('Ninguna reseña coincide con los filtros');
      boton(host, 'Limpiar filtros')!.click();
      fixture.detectChanges();

      expect(cargar).toHaveBeenLastCalledWith({ texto: '', calificacion: null, restauranteId: null });
      expect(host.querySelector<HTMLSelectElement>('#filtro-resenas-calificacion')!.value).toBe('');
    });

    it('debería ofrecer cargar más solo cuando quedan reseñas', () => {
      lista.set(resenas);
      const fixture = crear();
      const host = fixture.nativeElement as HTMLElement;
      expect(boton(host, 'Cargar más')).toBeUndefined();

      hayMas.set(true);
      fixture.detectChanges();
      boton(host, 'Cargar más')!.click();

      expect(cargarMas).toHaveBeenCalledTimes(1);
    });
  });
});
