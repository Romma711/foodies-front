import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería iniciar inválido', () => {
    expect(component.formulario().valid()).toBe(false);
  });

  it('debería ser válido con email y contraseña correctos', () => {
    component.formulario.email().value.set('foodies@ejemplo.com');
    component.formulario.password().value.set('secreto123');

    expect(component.formulario().valid()).toBe(true);
  });

  it('debería ser inválido con un email mal formado', () => {
    component.formulario.email().value.set('no-es-un-email');
    component.formulario.password().value.set('secreto123');

    expect(component.formulario().valid()).toBe(false);
  });
});
