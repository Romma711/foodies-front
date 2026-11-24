import { TestBed } from '@angular/core/testing';
import { violacionesAxe } from '../../../shared/testing/axe';
import { I18n } from '../i18n.service';
import { SelectorIdioma } from './selector-idioma';

describe('SelectorIdioma', () => {
  beforeEach(() => localStorage.clear());

  // Tests share one jsdom: leave Spanish behind for the next spec file.
  afterEach(() => {
    localStorage.removeItem('foodies.idioma');
    document.documentElement.lang = 'es';
  });

  const render = async () => {
    const fixture = TestBed.createComponent(SelectorIdioma);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, element, select: element.querySelector('select')! };
  };

  it('ofrece español, inglés y portugués con el idioma actual elegido', async () => {
    const { select } = await render();

    expect([...select.options].map((opcion) => opcion.textContent?.trim())).toEqual([
      'Español',
      'English',
      'Português',
    ]);
    expect(select.value).toBe('es');
  });

  it('cambia el idioma de la app al elegir una opción', async () => {
    const { fixture, element, select } = await render();

    select.value = 'en';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(TestBed.inject(I18n).idioma()).toBe('en');
    expect(localStorage.getItem('foodies.idioma')).toBe('en');
    expect(element.querySelector('label')?.textContent).toBe('Language');
  });

  it('muestra el idioma recordado', async () => {
    localStorage.setItem('foodies.idioma', 'pt');

    const { select } = await render();

    expect(select.value).toBe('pt');
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { element } = await render();

    expect(await violacionesAxe(element)).toEqual([]);
  });
});
