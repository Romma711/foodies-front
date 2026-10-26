import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { ToastOutlet } from './toast-outlet';

describe('ToastOutlet', () => {
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastOutlet],
      providers: [ToastService],
    }).compileComponents();
    toasts = TestBed.inject(ToastService);
  });

  function crear() {
    const fixture = TestBed.createComponent(ToastOutlet);
    fixture.detectChanges();
    return fixture;
  }

  it('debería anunciar los éxitos de forma educada y los errores como alerta', () => {
    const fixture = crear();
    toasts.exito('Tu reseña se actualizó.');
    toasts.error('No se pudo eliminar la reseña.');
    fixture.detectChanges();
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('[role="status"]')?.textContent).toContain(
      'Tu reseña se actualizó.',
    );
    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo eliminar la reseña.',
    );
  });

  it('debería cerrar el toast con su botón', () => {
    const fixture = crear();
    toasts.exito('Tu reseña se actualizó.');
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Cerrar notificación"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(toasts.toasts().length).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="toast"]')).toBeNull();
  });
});
