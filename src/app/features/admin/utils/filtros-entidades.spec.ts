import { EntidadCliente, EntidadRestaurante } from '../models/entidades-admin';
import {
  FILTRO_CLIENTES_VACIO,
  FILTRO_RESTAURANTES_VACIO,
  filtrarClientes,
  filtrarRestaurantes,
} from './filtros-entidades';

describe('filtros de entidades', () => {
  const cliente = (overrides: Partial<EntidadCliente> = {}): EntidadCliente => ({
    id: 1,
    nombre: 'Ana',
    apellido: 'Gómez',
    email: 'ana@mail.com',
    telefono: '2235550000',
    strikes: 0,
    activo: true,
    fechaRegistro: null,
    ...overrides,
  });
  const restaurante = (overrides: Partial<EntidadRestaurante> = {}): EntidadRestaurante => ({
    id: 1,
    nombre: 'Ochiwan',
    ubicacion: 'Alem 3650',
    especialidad: 'ASIATICA',
    estado: 'APROBADO',
    strikes: 0,
    activo: true,
    usuarioId: 9,
    email: 'ochiwan@mail.com',
    ...overrides,
  });

  describe('clientes', () => {
    const ana = cliente();
    const bruno = cliente({ id: 2, nombre: 'Bruno', apellido: 'Díaz', email: 'bruno@mail.com', telefono: '1144443333', strikes: 2, activo: false });
    const lista = [ana, bruno];

    it('sin filtros devuelve todos', () => {
      expect(filtrarClientes(lista, FILTRO_CLIENTES_VACIO)).toEqual(lista);
    });

    it('busca por nombre completo, email o teléfono sin distinguir mayúsculas ni acentos', () => {
      const con = (texto: string) => filtrarClientes(lista, { ...FILTRO_CLIENTES_VACIO, texto });
      expect(con('ana gomez')).toEqual([ana]);
      expect(con('  DIAZ ')).toEqual([bruno]);
      expect(con('bruno@')).toEqual([bruno]);
      expect(con('5550')).toEqual([ana]);
      expect(con('nadie')).toEqual([]);
    });

    it('filtra por activos o dados de baja y por "con strikes"', () => {
      expect(filtrarClientes(lista, { ...FILTRO_CLIENTES_VACIO, estado: 'activos' })).toEqual([ana]);
      expect(filtrarClientes(lista, { ...FILTRO_CLIENTES_VACIO, estado: 'inactivos' })).toEqual([bruno]);
      expect(filtrarClientes(lista, { ...FILTRO_CLIENTES_VACIO, conStrikes: true })).toEqual([bruno]);
    });
  });

  describe('restaurantes', () => {
    const ochiwan = restaurante();
    const trattoria = restaurante({
      id: 2,
      nombre: 'La Trattoria',
      ubicacion: 'Olavarría 2710',
      especialidad: 'PASTAS',
      estado: 'PENDIENTE',
      activo: false,
      email: 'nonna@mail.com',
    });
    const lista = [ochiwan, trattoria];

    it('sin filtros devuelve todos', () => {
      expect(filtrarRestaurantes(lista, FILTRO_RESTAURANTES_VACIO)).toEqual(lista);
    });

    it('busca por nombre, dirección o email del encargado sin distinguir acentos', () => {
      const con = (texto: string) => filtrarRestaurantes(lista, { ...FILTRO_RESTAURANTES_VACIO, texto });
      expect(con('trattoria')).toEqual([trattoria]);
      expect(con('olavarria')).toEqual([trattoria]);
      expect(con('OCHIWAN@')).toEqual([ochiwan]);
    });

    it('filtra por estado, especialidad y activo, combinando los filtros', () => {
      const con = (f: Partial<typeof FILTRO_RESTAURANTES_VACIO>) =>
        filtrarRestaurantes(lista, { ...FILTRO_RESTAURANTES_VACIO, ...f });
      expect(con({ estado: 'PENDIENTE' })).toEqual([trattoria]);
      expect(con({ especialidad: 'ASIATICA' })).toEqual([ochiwan]);
      expect(con({ activo: 'inactivos' })).toEqual([trattoria]);
      expect(con({ estado: 'PENDIENTE', especialidad: 'ASIATICA' })).toEqual([]);
    });
  });
});
