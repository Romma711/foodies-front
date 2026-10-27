import { ResenaListDTO } from '../models';
import { filtrarYOrdenar } from './ordenar-resenas';

describe('filtrarYOrdenar', () => {
  const resena = (id: number, calificacion: number): ResenaListDTO => ({
    id,
    calificacion,
    nombreUsuario: `Usuario ${id}`,
    comentario: 'Comentario',
  });

  const resenas = [resena(1, 4), resena(2, 5), resena(3, 2), resena(4, 5)];
  const ids = (lista: ResenaListDTO[]) => lista.map((item) => item.id);

  it('debería ordenar por más recientes usando el id descendente', () => {
    expect(ids(filtrarYOrdenar(resenas, 'recientes', null))).toEqual([4, 3, 2, 1]);
  });

  it('debería ordenar por mejor puntuación y desempatar por más reciente', () => {
    expect(ids(filtrarYOrdenar(resenas, 'mejores', null))).toEqual([4, 2, 1, 3]);
  });

  it('debería ordenar por peor puntuación y desempatar por más reciente', () => {
    expect(ids(filtrarYOrdenar(resenas, 'peores', null))).toEqual([3, 1, 4, 2]);
  });

  it('debería filtrar por cantidad de estrellas', () => {
    expect(ids(filtrarYOrdenar(resenas, 'recientes', 5))).toEqual([4, 2]);
    expect(filtrarYOrdenar(resenas, 'recientes', 1)).toEqual([]);
  });

  it('no debería modificar el arreglo original', () => {
    const original = [...resenas];

    filtrarYOrdenar(resenas, 'mejores', null);

    expect(resenas).toEqual(original);
  });
});
