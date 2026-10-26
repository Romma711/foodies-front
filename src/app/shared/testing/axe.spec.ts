import { violacionesAxe } from './axe';

describe('violacionesAxe', () => {
  function montar(html: string): HTMLElement {
    const contenedor = document.createElement('div');
    contenedor.innerHTML = html;
    document.body.appendChild(contenedor);
    return contenedor;
  }

  afterEach(() => (document.body.innerHTML = ''));

  it('debería detectar un botón sin nombre accesible y un input sin label', async () => {
    const violaciones = await violacionesAxe(
      montar('<button type="button"><svg aria-hidden="true"></svg></button><input type="text" />'),
    );

    expect(violaciones.some((linea) => linea.startsWith('button-name'))).toBe(true);
    expect(violaciones.some((linea) => linea.startsWith('label'))).toBe(true);
  });

  it('debería aprobar markup accesible', async () => {
    const violaciones = await violacionesAxe(
      montar('<button type="button">Guardar</button><label>Email <input type="email" /></label>'),
    );

    expect(violaciones).toEqual([]);
  });
});
