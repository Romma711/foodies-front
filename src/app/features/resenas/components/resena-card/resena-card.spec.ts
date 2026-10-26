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

  it('debería exponer la calificación accesible mediante las estrellas', () => {
    const fixture = crear(resena);
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Calificación: 5.0 de 5 estrellas',
    );
  });

  it('no debería mostrar el ID interno ni una nota duplicada', () => {
    const fixture = crear(resena);
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.textContent).not.toContain('Reseña #');
    expect(elemento.querySelector('[data-testid="calificacion"]')).toBeNull();
  });

  it('no debería ofrecer editar una reseña ajena', () => {
    const fixture = crear(resena);

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('debería emitir editar cuando la reseña es editable', () => {
    const fixture = TestBed.createComponent(ResenaCard);
    fixture.componentRef.setInput('resena', resena);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();
    const editar = vi.fn();
    fixture.componentInstance.editar.subscribe(editar);

    const boton = fixture.nativeElement.querySelector(
      'button[aria-label="Editar tu reseña"]',
    ) as HTMLButtonElement;
    boton.click();

    expect(editar).toHaveBeenCalled();
  });
});
