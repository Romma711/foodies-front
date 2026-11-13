import { TestBed } from '@angular/core/testing';
import { StarRating } from './star-rating';

describe('StarRating', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRating],
    }).compileComponents();
  });

  function crear(valor: number) {
    const fixture = TestBed.createComponent(StarRating);
    fixture.componentRef.setInput('value', valor);
    fixture.detectChanges();
    return fixture;
  }

  function crearInteractivo(valor: number) {
    const fixture = TestBed.createComponent(StarRating);
    fixture.componentRef.setInput('value', valor);
    fixture.componentRef.setInput('interactive', true);
    fixture.componentRef.setInput('label', 'Tu calificación');
    fixture.componentRef.setInput('describedBy', 'ayuda');
    fixture.detectChanges();
    return fixture;
  }

  it('debería renderizar cinco estrellas', () => {
    const fixture = crear(4);
    const estrellas = fixture.nativeElement.querySelectorAll('[data-testid="star"]');

    expect(estrellas.length).toBe(5);
  });

  it('debería exponer la calificación en el aria-label', () => {
    const fixture = crear(4.5);
    const contenedor = fixture.nativeElement.querySelector('[role="img"]');

    expect(contenedor.getAttribute('aria-label')).toBe('Calificación: 4.5 de 5 estrellas');
  });

  it('debería completar media estrella cuando la calificación es 4.5', () => {
    const fixture = crear(4.5);
    const estrellas = fixture.nativeElement.querySelectorAll('[data-testid="star"]');
    const ultima = estrellas[4].querySelector('span') as HTMLElement;

    expect(ultima.style.width).toBe('50%');
  });

  it('debería emitir la calificación elegida en modo interactivo', () => {
    const fixture = crearInteractivo(0);
    const emitida = vi.fn();
    fixture.componentInstance.valueChange.subscribe(emitida);
    const elemento = fixture.nativeElement as HTMLElement;
    const radios = elemento.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    expect(radios.length).toBe(5);
    radios[3].click();

    expect(emitida).toHaveBeenCalledWith(4);
  });

  it('debería marcar la opción actual y describir el grupo', () => {
    const fixture = crearInteractivo(3);
    const elemento = fixture.nativeElement as HTMLElement;
    const grupo = elemento.querySelector('[role="radiogroup"]') as HTMLElement;
    const radios = elemento.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    expect(grupo.getAttribute('aria-label')).toBe('Tu calificación');
    expect(grupo.getAttribute('aria-describedby')).toBe('ayuda');
    expect(radios[2].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
  });

  it('debería marcar el grupo y las estrellas como inválidos cuando corresponde', () => {
    const fixture = crearInteractivo(0);
    fixture.componentRef.setInput('invalid', true);
    fixture.detectChanges();

    const grupo = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
    const radio = fixture.nativeElement.querySelector('input[type="radio"]') as HTMLInputElement;

    expect(grupo.getAttribute('aria-invalid')).toBe('true');
    expect(radio.getAttribute('aria-invalid')).toBe('true');
  });

  describe('valor visible (contraste WCAG 1.4.11)', () => {
    it('no debería mostrar el número por defecto en modo lectura', () => {
      const fixture = crear(3.5);

      expect(fixture.nativeElement.querySelector('[data-testid="valor"]')).toBeNull();
    });

    it('debería mostrar el número oculto a lectores de pantalla cuando se pide', () => {
      const fixture = crear(3.5);
      fixture.componentRef.setInput('mostrarValor', true);
      fixture.detectChanges();
      const valor = fixture.nativeElement.querySelector('[data-testid="valor"]') as HTMLElement;

      expect(valor.textContent?.trim()).toBe('3.5');
      expect(valor.getAttribute('aria-hidden')).toBe('true');
    });

    it('debería mostrar la elección en modo interactivo solo cuando hay una', () => {
      const vacio = crearInteractivo(0);
      expect(vacio.nativeElement.querySelector('[data-testid="valor"]')).toBeNull();

      const elegido = crearInteractivo(4);
      expect(
        elegido.nativeElement.querySelector('[data-testid="valor"]')?.textContent?.trim(),
      ).toBe('4 de 5');
    });
  });
});
