import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { I18n } from './i18n.service';
import { TituloTraducido } from './titulo-traducido';

@Component({ template: '' })
class Vacia {}

describe('TituloTraducido', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '', component: Vacia, title: 'idioma.etiqueta' }]),
        { provide: TitleStrategy, useClass: TituloTraducido },
      ],
    });
  });

  // Tests share one jsdom: leave Spanish behind for the next spec file.
  afterEach(() => {
    localStorage.removeItem('foodies.idioma');
    document.documentElement.lang = 'es';
  });

  it('traduce el título de la ruta y lo actualiza al cambiar de idioma', async () => {
    await TestBed.inject(Router).navigateByUrl('/');
    const title = TestBed.inject(Title);
    expect(title.getTitle()).toBe('Idioma');

    TestBed.inject(I18n).usar('en');
    TestBed.tick();

    expect(title.getTitle()).toBe('Language');
  });
});
