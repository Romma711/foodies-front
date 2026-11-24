import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18n } from './i18n.service';
import { TPipe } from './t.pipe';

@Component({
  imports: [TPipe],
  template: `<p>{{ 'idioma.etiqueta' | t }}</p>`,
})
class Anfitrion {}

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
});
