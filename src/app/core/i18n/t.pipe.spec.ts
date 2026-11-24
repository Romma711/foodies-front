import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18n } from './i18n.service';
import { TClavePipe, TPipe } from './t.pipe';
import { Mensaje } from './traducir';

@Component({
  imports: [TPipe],
  template: `<p>{{ 'idioma.etiqueta' | t }}</p>`,
})
class Anfitrion {}

@Component({
  imports: [TClavePipe, TPipe],
  template: `<p id="clave">{{ deValidador | tClave }}</p>
    <p id="mensaje">{{ mensaje | t }}</p>
    <p id="backend">{{ backend | t }}</p>`,
})
class AnfitrionMensajes {
  protected readonly deValidador: string = 'idioma.etiqueta';
  protected readonly mensaje: Mensaje = { clave: 'idioma.etiqueta' };
  protected readonly backend: Mensaje = { texto: 'Mensaje del back' };
}

describe('TPipe', () => {
  beforeEach(() => localStorage.clear());

  // Tests share one jsdom: leave Spanish behind for the next spec file.
  afterEach(() => {
    localStorage.removeItem('foodies.idioma');
    document.documentElement.lang = 'es';
  });

  it('vuelve a pintar el texto cuando cambia el idioma, sin recargar', async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const parrafo = (fixture.nativeElement as HTMLElement).querySelector('p')!;
    expect(parrafo.textContent).toBe('Idioma');

    TestBed.inject(I18n).usar('en');
    await fixture.whenStable();

    expect(parrafo.textContent).toBe('Language');
  });

  it('traduce mensajes guardados y deja como están los textos del backend', async () => {
    const fixture = TestBed.createComponent(AnfitrionMensajes);
    TestBed.inject(I18n).usar('en');
    await fixture.whenStable();
    const texto = (id: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(`#${id}`)?.textContent;

    expect(texto('clave')).toBe('Language');
    expect(texto('mensaje')).toBe('Language');
    expect(texto('backend')).toBe('Mensaje del back');
  });
});
