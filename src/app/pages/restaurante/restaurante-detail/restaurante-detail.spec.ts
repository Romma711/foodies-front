import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RestauranteDetail } from './restaurante-detail';

describe('RestauranteDetail', () => {
  const restaurante = {
    id: 5,
    nombre: 'La Parrilla',
    cupoMaximo: 40,
    ubicacion: 'Av. Siempreviva 742',
    especialidad: 'PARRILLA',
  };

  let component: RestauranteDetail;
  let fixture: ComponentFixture<RestauranteDetail>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestauranteDetail],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RestauranteDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('restauranteId', '5');
    fixture.detectChanges();
    await fixture.whenStable();

    httpMock.expectOne('/api/restaurantes/5').flush(restaurante);
    fixture.detectChanges();
    await fixture.whenStable();

    // El formulario de reserva también pide la lista de restaurantes.
    httpMock.expectOne('/api/restaurantes').flush([]);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el nombre, la especialidad y el cupo', () => {
    const texto = fixture.nativeElement.textContent as string;

    expect(texto).toContain('La Parrilla');
    expect(texto).toContain('Parrilla');
    expect(texto).toContain('Cupo diario: 40 comensales');
  });

  it('debería incrustar el formulario de reserva con el restaurante fijo', () => {
    const formulario = fixture.nativeElement.querySelector('app-reserva-form');

    expect(formulario).toBeTruthy();
    expect(component.restaurante()).toEqual(restaurante);
    expect(component.especialidad()).toBe('Parrilla');
  });
});
