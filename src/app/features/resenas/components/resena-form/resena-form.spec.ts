import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResenaDetailDTO } from '../../models';
import { ResenaService } from '../../services/resena.service';
import { ResenaForm } from './resena-form';

describe('ResenaForm', () => {
  const detalle: ResenaDetailDTO = {
    id: 30,
    comentario: 'La pasta estaba increíble.',
    calificacion: 5,
    nombreUsuario: 'Ana',
    nombreRestaurant: 'Ochiwan',
  };

  let saving: WritableSignal<boolean>;
  let mutationError: WritableSignal<string | null>;
  let crear: ReturnType<typeof vi.fn>;
  let actualizar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    saving = signal(false);
    mutationError = signal<string | null>(null);
    crear = vi.fn(() => of(detalle));
    actualizar = vi.fn(() => of({ ...detalle, comentario: 'Volví y estuvo aún mejor.' }));

    await TestBed.configureTestingModule({
      imports: [ResenaForm],
      providers: [
        {
          provide: ResenaService,
          useValue: {
            saving: saving.asReadonly(),
            mutationError: mutationError.asReadonly(),
            crear,
            actualizar,
          },
        },
      ],
    }).compileComponents();
  });

  function crearComponente() {
    const fixture = TestBed.createComponent(ResenaForm);
    fixture.componentRef.setInput('restauranteId', 5);
    fixture.detectChanges();
    return fixture;
  }

  it('debería renderizar cinco estrellas', () => {
    const fixture = crearComponente();
    const radios = fixture.nativeElement.querySelectorAll('input[type="radio"]');

    expect(radios.length).toBe(5);
  });

  it('debería publicar la reseña con los datos del formulario', async () => {
    const fixture = crearComponente();
    const elemento = fixture.nativeElement as HTMLElement;
    const radios = elemento.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    radios[4].click();
    fixture.detectChanges();

    const textarea = elemento.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = '  La pasta estaba increíble.  ';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const emitida = vi.fn();
    fixture.componentInstance.creada.subscribe(emitida);

    await fixture.componentInstance.enviar(new Event('submit'));

    expect(crear).toHaveBeenCalledWith({
      comentario: 'La pasta estaba increíble.',
      calificacion: 5,
      restaurantId: 5,
    });
    expect(emitida).toHaveBeenCalledWith(detalle);
  });

  it('debería mostrar los errores y no enviar un formulario inválido', async () => {
    const fixture = crearComponente();

    await fixture.componentInstance.enviar(new Event('submit'));
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(crear).not.toHaveBeenCalled();
    expect(texto).toContain('Elegí de 1 a 5 estrellas.');
    expect(texto).toContain('Contanos tu experiencia.');
  });

  it('debería mostrar el error devuelto por la API', () => {
    mutationError.set('Ya realizaste una reseña para este restaurante.');
    const fixture = crearComponente();
    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alerta.textContent).toContain('Ya realizaste una reseña');
  });

  it('debería emitir cancelada al cerrar el formulario', () => {
    const fixture = crearComponente();
    const cancelada = vi.fn();
    fixture.componentInstance.cancelada.subscribe(cancelada);

    const cerrar = fixture.nativeElement.querySelector(
      'button[aria-label="Cerrar formulario de reseña"]',
    ) as HTMLButtonElement;
    cerrar.click();

    expect(cancelada).toHaveBeenCalled();
  });

  describe('en modo edición', () => {
    function crearEdicion() {
      const fixture = TestBed.createComponent(ResenaForm);
      fixture.componentRef.setInput('restauranteId', 5);
      fixture.componentRef.setInput('resena', {
        id: 30,
        nombreUsuario: 'Ana',
        comentario: 'La pasta estaba increíble.',
        calificacion: 4,
      });
      fixture.detectChanges();
      return fixture;
    }

    it('debería precargar la calificación y el comentario', () => {
      const fixture = crearEdicion();
      const elemento = fixture.nativeElement as HTMLElement;
      const radios = elemento.querySelectorAll<HTMLInputElement>('input[type="radio"]');

      expect(radios[3].checked).toBe(true);
      expect((elemento.querySelector('textarea') as HTMLTextAreaElement).value).toBe(
        'La pasta estaba increíble.',
      );
      expect(elemento.textContent).toContain('Editar tu reseña');
      expect(elemento.textContent).toContain('Guardar cambios');
    });

    it('debería guardar con PUT y emitir actualizada', async () => {
      const fixture = crearEdicion();
      const elemento = fixture.nativeElement as HTMLElement;
      const textarea = elemento.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = ' Volví y estuvo aún mejor. ';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      const emitida = vi.fn();
      fixture.componentInstance.actualizada.subscribe(emitida);

      await fixture.componentInstance.enviar(new Event('submit'));

      expect(actualizar).toHaveBeenCalledWith(30, {
        comentario: 'Volví y estuvo aún mejor.',
        calificacion: 4,
      });
      expect(crear).not.toHaveBeenCalled();
      expect(emitida).toHaveBeenCalled();
    });
  });
});
