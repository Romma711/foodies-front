export const ROLES = ['ADMIN', 'RESTAURANTE', 'CLIENTE'] as const;

/** Front portal roles. The backend calls the restaurant role `ROLE_ENCARGADO`. */
export type Role = (typeof ROLES)[number];

/** Roles that can create an account from the public register page. */
export type RegistrableRole = Exclude<Role, 'ADMIN'>;

/** Mirrors the backend `EspecialidadDeComida` enum. */
export const ESPECIALIDADES = [
  'PESCADOS',
  'PARRILLA',
  'PASTAS',
  'ASIATICA',
  'MINUTAS',
  'CAFE',
] as const;

export type EspecialidadDeComida = (typeof ESPECIALIDADES)[number];

/** `LoginRequestDTO` */
export interface LoginRequest {
  email: string;
  password: string;
}

/** `RegistroClienteDTO` */
export interface RegisterClienteRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
}

/** `RegistroRestauranteRequestDTO` */
export interface RegisterRestauranteRequest {
  email: string;
  password: string;
  nombreRestaurante: string;
  direccion: string;
  telefono: string;
  especialidadDeComida: EspecialidadDeComida;
  cupoMaximo: number;
}

/** `POST /api/auth/login` answers `{ "Token": "Bearer <jwt>" }`. */
export interface AuthResponse {
  Token: string;
}

export interface JwtPayload {
  sub?: string;
  exp?: number;
  [claim: string]: unknown;
}

export interface Session {
  role: Role;
  subject: string | null;
  token: string;
}

/** Thrown when a valid account tries to sign in through another role's portal. */
export class RoleMismatchError extends Error {
  constructor(
    readonly expected: Role,
    readonly actual: Role | null,
  ) {
    super(`Expected role ${expected} but token has ${actual ?? 'no role'}`);
    this.name = 'RoleMismatchError';
  }
}

/** Thrown when a restaurant account (`ROLE_PENDIENTE`) has not been approved by an admin yet. */
export class PendingApprovalError extends Error {
  constructor() {
    super('Restaurant account pending approval');
    this.name = 'PendingApprovalError';
  }
}
