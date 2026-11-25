import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Mensaje } from '../../../core/i18n/traducir';
import { I18n } from '../../../core/i18n/i18n.service';
import { EntradaListaEspera } from '../../models/lista-espera';
import { ListaEsperaService } from '../../services/lista-espera.service';
import { MiListaEspera } from './mi-lista-espera';

describe('MiListaEspera', () => {
  const entrada: EntradaListaEspera = {
    id: 4,
    idRestaurant: 5,
    nombreResto: 'La Brasa de Güemes',
    fecha: '2026-12-05',
    horario: '21:30:00',
    idTurno: 12,
    cantidad: 4,
    estado: 'ESPERANDO',
    creada: '2026-11-24T10:00:00',
  };

  let entradas: WritableSignal<EntradaListaEspera[]>;
  let error: WritableSignal<Mensaje | null>;
  let listarMias: ReturnType<typeof vi.fn>;
  let salir: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    entradas = signal<EntradaListaEspera[]>([]);
    error = signal<Mensaje | null>(null);
    listarMias = vi.fn(() => of([]));
    salir = vi.fn(() => of(undefined));
    await TestBed.configureTestingModule({
      imports: [MiListaEspera],
      providers: [
        {
          provide: ListaEsperaService,
          useValue: {
            entradas: entradas.asReadonly(),
            loading: signal(false),
            saving: signal(false),
            error: error.asReadonly(),
            listarMias,
            salir,
            limpiarError: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  function crear() {
    const fixture = TestBed.createComponent(MiListaEspera);
    fixture.detectChanges();
    return fixture;
  }

  function boton(host: HTMLElement, texto: string): HTMLButtonElement | undefined {
    return [...host.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === texto,
    );
  }

  it('carga las inscripciones del cliente y avisa cuando no hay ninguna', () => {
    const host = crear().nativeElement as HTMLElement;

    expect(listarMias).toHaveBeenCalled();
    expect(host.querySelector('[data-testid="lista-vacia"]')?.textContent).toContain(
      'No estás en ninguna lista de espera.',
    );
  });

  it('muestra restaurante, fecha, turno, personas y estado de cada inscripción', () => {
    entradas.set([
      entrada,
      { ...entrada, id: 5, estado: 'NOTIFICADA' },
      { ...entrada, id: 6, estado: 'VENCIDA' },
    ]);
    const host = crear().nativeElement as HTMLElement;
    const [esperando, notificada, vencida] = [...host.querySelectorAll('li')].map(
      (li) => li.textContent ?? '',
    );

    expect(esperando).toContain('La Brasa de Güemes');
    expect(esperando).toContain('a las 21:30 · 4 personas');
    expect(esperando).toContain('Esperando lugar');
    expect(esperando).toContain('Salir de la lista');
    expect(notificada).toContain('Se liberó un lugar');
    expect(notificada).toContain('Reservá desde la página del restaurante');
    expect(vencida).toContain('Vencida');
    expect(vencida).not.toContain('Salir de la lista');
  });

  it('sale de la lista solo después de confirmar en la página', () => {
    entradas.set([entrada]);
    const fixture = crear();
    const host = fixture.nativeElement as HTMLElement;

    boton(host, 'Salir de la lista')!.click();
    fixture.detectChanges();
    expect(host.textContent).toContain('¿Salir de esta lista de espera?');
    expect(salir).not.toHaveBeenCalled();

    boton(host, 'Sí, salir')!.click();
    fixture.detectChanges();
    expect(salir).toHaveBeenCalledWith(4);
  });

  it('muestra en inglés un error del back con código', () => {
    const i18n = TestBed.inject(I18n);
    i18n.usar('en');
    try {
      error.set({
        codigo: 'errores.HAY_LUGAR',
        params: {},
        texto: 'Hay lugar en ese horario: reservá directamente',
      });
      const host = crear().nativeElement as HTMLElement;

      expect(host.querySelector('[role="alert"]')?.textContent).toContain(
        'There is room at that time: book directly.',
      );
    } finally {
      i18n.usar('es');
    }
  });

  it('muestra el mensaje de error del servidor', () => {
    error.set({ texto: 'Esa inscripción ya está cerrada' });
    const host = crear().nativeElement as HTMLElement;

    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'Esa inscripción ya está cerrada',
    );
  });
});
