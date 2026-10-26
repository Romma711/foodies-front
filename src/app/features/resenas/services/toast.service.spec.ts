import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('debería agregar toasts de éxito y error en orden', () => {
    service.exito('Guardado');
    service.error('Falló');

    expect(service.toasts().map((toast) => [toast.tipo, toast.mensaje])).toEqual([
      ['exito', 'Guardado'],
      ['error', 'Falló'],
    ]);
  });

  it('debería cerrar el toast de éxito a los 4 segundos', () => {
    service.exito('Guardado');

    vi.advanceTimersByTime(3999);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts().length).toBe(0);
  });

  it('debería dejar los errores más tiempo en pantalla', () => {
    service.error('Falló');

    vi.advanceTimersByTime(4000);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(2000);
    expect(service.toasts().length).toBe(0);
  });

  it('debería permitir cerrar un toast manualmente', () => {
    service.exito('Uno');
    service.exito('Dos');

    service.cerrar(service.toasts()[0].id);

    expect(service.toasts().map((toast) => toast.mensaje)).toEqual(['Dos']);
  });
});
