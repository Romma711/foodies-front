import { coincideNombre, normalizarBusqueda } from './busqueda';

describe('búsqueda por nombre', () => {
  it('ignora mayúsculas, tildes y espacios de los costados', () => {
    expect(normalizarBusqueda('  Café Martínez ')).toBe('cafe martinez');
  });

  it('encuentra el término en cualquier parte del nombre', () => {
    expect(coincideNombre('La Parrilla de Juan', 'PARRI')).toBe(true);
    expect(coincideNombre('Café Martínez', 'martinez')).toBe(true);
    expect(coincideNombre('Ochiwan', 'parrilla')).toBe(false);
  });

  it('un término vacío no filtra nada', () => {
    expect(coincideNombre('Ochiwan', '')).toBe(true);
    expect(coincideNombre('Ochiwan', '   ')).toBe(true);
  });
});
