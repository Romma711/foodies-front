import { TestBed } from '@angular/core/testing';
import { ResenaListDTO } from '../../models';
import { ResenaCard } from './resena-card';

describe('ResenaCard', () => {
  const resena: ResenaListDTO = {
    id: 12,
    nombreUsuario: 'Ana Gómez',
    comentario: 'La pasta estaba increíble y la atención fue excelente.',
    calificacion: 5,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResenaCard],
    }).compileComponents();
  });

  function crear(datos: ResenaListDTO) {
    const fixture = TestBed.createComponent(ResenaCard);
    fixture.componentRef.setInput('resena', datos);
    fixture.detectChanges();
    return fixture;
  }

  it('debería mostrar el nombre, comentario e iniciales', () => {
    const fixture = crear(resena);
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('[data-testid="nombre"]')?.textContent).toContain('Ana Gómez');
    expect(elemento.querySelector('[data-testid="comentario"]')?.textContent).toContain(
      'La pasta estaba increíble',
    );
    expect(elemento.querySelector('[data-testid="avatar"]')?.textContent).toContain('AG');
  });

  it('debería usar Anónimo cuando el backend no envía nombre', () => {
    const fixture = crear({
      ...resena,
      nombreUsuario: null as unknown as string,
    });
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('[data-testid="nombre"]')?.textContent).toContain('Anónimo');
    expect(elemento.querySelector('[data-testid="avatar"]')?.textContent).toContain('A');
  });

  it('debería mostrar la calificación numérica', () => {
    const fixture = crear(resena);
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('[data-testid="calificacion"]')?.textContent).toContain('5.0');
  });
});
