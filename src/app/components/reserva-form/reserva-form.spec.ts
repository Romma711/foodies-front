import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ReservaForm } from './reserva-form';

describe('ReservaForm', () => {
  let component: ReservaForm;
  let fixture: ComponentFixture<ReservaForm>;
  let httpMock: HttpTestingController;

  function isoEnDias(dias: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservaForm],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReservaForm);
    component = fixture.componentInstance;
    httpMock.expectOne('/api/restaurantes').flush([]);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería iniciar inválido', () => {
    expect(component.formulario().valid()).toBe(false);
  });

  it('debería ser válido con todos los datos correctos', () => {
    component.formulario.idRestaurant().value.set('5');
    component.formulario.fechaReserva().value.set(isoEnDias(30));
    component.formulario.horarioLlegada().value.set('20:30');
    component.formulario.cantidad().value.set(2);

    expect(component.formulario().valid()).toBe(true);
  });

  it('debería rechazar una fecha pasada', () => {
    component.formulario.idRestaurant().value.set('5');
    component.formulario.fechaReserva().value.set('2000-01-01');
    component.formulario.horarioLlegada().value.set('20:30');
    component.formulario.cantidad().value.set(2);

    expect(component.formulario().valid()).toBe(false);
  });
});
