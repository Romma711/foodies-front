import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ResenaList } from './resena-list';

@Component({ selector: 'app-restaurante-resenas', template: '' })
class RestauranteResenasStub {
  readonly restauranteId = input<number>();
}

describe('ResenaList', () => {
  it('debería delegar en el bloque de reseñas con el id numérico de la ruta', async () => {
    TestBed.overrideComponent(ResenaList, { set: { imports: [RestauranteResenasStub] } });
    await TestBed.configureTestingModule({ imports: [ResenaList] }).compileComponents();

    const fixture = TestBed.createComponent(ResenaList);
    fixture.componentRef.setInput('restauranteId', '5');
    fixture.detectChanges();

    const bloque = fixture.debugElement.query(By.directive(RestauranteResenasStub));
    expect((bloque.componentInstance as RestauranteResenasStub).restauranteId()).toBe(5);
  });
});
