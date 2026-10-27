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
});
