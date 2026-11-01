import { SolicitudRestaurante } from '../models/solicitud-restaurante';

/**
 * Pending request fixture. It lives outside any `.spec.ts`: importing a spec from another spec
 * registers its tests in the wrong file, and the suite fails now and then with "No test suite found".
 */
export function solicitud(overrides: Partial<SolicitudRestaurante> = {}): SolicitudRestaurante {
  return {
    restaurantId: 12,
    nombre: 'La Parrilla',
    ubicacion: 'Av. Colón 1200',
    especialidad: 'PARRILLA',
    cupoMaximo: 40,
    estado: 'PENDIENTE',
    usuarioId: 112,
    email: 'encargado@laparrilla.com',
    telefono: '2235550000',
    fechaRegistro: '2026-10-28T10:15:00',
    fotos: [
      { id: 1, url: '/api/files/fotos/3/a.jpg', portada: false },
      { id: 2, url: '/api/files/fotos/3/b.jpg', portada: true },
    ],
    ...overrides,
  };
}
