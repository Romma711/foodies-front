import { TestBed } from '@angular/core/testing';
import { I18n } from './i18n.service';
import { Clave, DICCIONARIOS, traducir } from './traducir';

describe('I18n', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'es';
  });

  const servicio = () => TestBed.inject(I18n);

  // Tests share one jsdom: leave Spanish behind for the next spec file.
  afterEach(() => {
    localStorage.removeItem('foodies.idioma');
    document.documentElement.lang = 'es';
  });

  it('arranca en español cuando no hay una elección guardada', () => {
    const i18n = servicio();

    expect(i18n.idioma()).toBe('es');
    expect(i18n.t('idioma.etiqueta')).toBe('Idioma');
    expect(document.documentElement.lang).toBe('es');
  });

  it('cambia los textos al instante al elegir otro idioma', () => {
    const i18n = servicio();

    i18n.usar('en');
    expect(i18n.t('idioma.etiqueta')).toBe('Language');

    i18n.usar('pt');
    expect(i18n.t('idioma.etiqueta')).toBe('Idioma');
    expect(i18n.idioma()).toBe('pt');
  });

  it('recuerda la elección en localStorage y la retoma al volver', () => {
    servicio().usar('en');

    expect(localStorage.getItem('foodies.idioma')).toBe('en');

    TestBed.resetTestingModule();
    expect(servicio().idioma()).toBe('en');
  });

  it('ignora un valor guardado que no es un idioma conocido', () => {
    localStorage.setItem('foodies.idioma', 'fr');

    expect(servicio().idioma()).toBe('es');
  });

  it('sigue funcionando cuando localStorage no está disponible', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    try {
      const i18n = servicio();
      expect(i18n.idioma()).toBe('es');
      expect(() => i18n.usar('pt')).not.toThrow();
      expect(i18n.idioma()).toBe('pt');
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('actualiza el atributo lang del documento', () => {
    const i18n = servicio();

    i18n.usar('pt');
    expect(document.documentElement.lang).toBe('pt-BR');

    i18n.usar('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('formatea fechas y números según el idioma', () => {
    const i18n = servicio();
    const fecha = new Date(2026, 10, 24);

    expect(i18n.numero(12345.5)).toBe('12.345,5');
    expect(i18n.fecha(fecha, { month: 'long' })).toBe('noviembre');

    i18n.usar('en');
    expect(i18n.numero(12345.5)).toBe('12,345.5');
    expect(i18n.fecha(fecha, { month: 'long' })).toBe('November');

    i18n.usar('pt');
    expect(i18n.numero(12345.5)).toBe('12.345,5');
    expect(i18n.fecha(fecha, { month: 'long' })).toBe('novembro');
  });
});

describe('traducir', () => {
  const es = DICCIONARIOS.es as Record<string, string>;

  it('reemplaza los marcadores {nombre} con los parámetros', () => {
    const clave = 'prueba.saludo' as Clave;
    es[clave] = 'Hola, {nombre}. Tenés {n} reservas.';
    try {
      expect(traducir('es', clave, { nombre: 'Ana', n: 2 })).toBe('Hola, Ana. Tenés 2 reservas.');
      expect(traducir('es', clave, { nombre: 'Ana' })).toBe('Hola, Ana. Tenés {n} reservas.');
    } finally {
      delete es[clave];
    }
  });

  it('usa el texto en español cuando al idioma le falta la clave', () => {
    const clave = 'prueba.solo-es' as Clave;
    es[clave] = 'Solo en español';
    try {
      expect(traducir('en', clave)).toBe('Solo en español');
      expect(traducir('pt', clave)).toBe('Solo en español');
    } finally {
      delete es[clave];
    }
  });

  it('devuelve la clave cuando ni el español la tiene', () => {
    expect(traducir('en', 'no.existe' as Clave)).toBe('no.existe');
  });
});
