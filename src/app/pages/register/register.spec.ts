import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería iniciar inválido', () => {
    expect(component.formulario().valid()).toBe(false);
  });

  it('debería ser válido con todos los datos correctos', () => {
    component.formulario.nombre().value.set('Ada');
    component.formulario.apellido().value.set('Lovelace');
    component.formulario.email().value.set('ada@ejemplo.com');
    component.formulario.password().value.set('secreto123');
    component.formulario.telefono().value.set('11 5555-5555');

    expect(component.formulario().valid()).toBe(true);
  });

  it('debería ser inválido con una contraseña corta', () => {
    component.formulario.nombre().value.set('Ada');
    component.formulario.apellido().value.set('Lovelace');
    component.formulario.email().value.set('ada@ejemplo.com');
    component.formulario.password().value.set('123');
    component.formulario.telefono().value.set('11 5555-5555');

    expect(component.formulario().valid()).toBe(false);
  });
});
