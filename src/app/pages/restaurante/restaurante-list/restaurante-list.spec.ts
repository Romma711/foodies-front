import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RestauranteList } from './restaurante-list';

describe('RestauranteList', () => {
  const restaurantes = [
    { id: 5, nombre: 'La Parrilla', ubicacion: 'Av. Siempreviva 742', especialidad: 'PARRILLA' },
    { id: 8, nombre: 'Sushi House', ubicacion: 'Calle Falsa 123', especialidad: 'ASIATICA' },
  ];

  let component: RestauranteList;
  let fixture: ComponentFixture<RestauranteList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestauranteList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RestauranteList);
    component = fixture.componentInstance;
    httpMock.expectOne('/api/restaurantes').flush(restaurantes);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar los restaurantes como enlaces al detalle', () => {
    const texto = fixture.nativeElement.textContent as string;
    const enlaces = fixture.nativeElement.querySelectorAll('a[href]');

    expect(texto).toContain('La Parrilla');
    expect(enlaces.length).toBe(2);
    expect((enlaces[0] as HTMLAnchorElement).getAttribute('href')).toBe('/restaurantes/5');
  });

  it('debería formatear la especialidad', () => {
    expect(component.especialidad('PARRILLA')).toBe('Parrilla');
    expect(component.especialidad('ASIATICA')).toBe('Asiática');
    expect(component.especialidad('DESCONOCIDA')).toBe('Desconocida');
  });
});
