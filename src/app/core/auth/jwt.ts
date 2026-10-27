import { JwtPayload, Role } from './auth.models';

/** Claims checked, in order, to find the user's authorities. The backend uses `roles`. */
const ROLE_CLAIMS = ['roles', 'role', 'rol', 'authorities'] as const;

/** Backend authority (without the `ROLE_` prefix) → front portal role. */
const PORTAL_ROLE_BY_AUTHORITY: Record<string, Role> = {
  ADMIN: 'ADMIN',
  ENCARGADO: 'RESTAURANTE',
  RESTAURANTE: 'RESTAURANTE',
  CLIENTE: 'CLIENTE',
};

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0)));
    const payload: unknown = JSON.parse(json);
    return typeof payload === 'object' && payload !== null ? (payload as JwtPayload) : null;
  } catch {
    return null;
  }
}

export function isExpired(payload: JwtPayload, nowMs: number): boolean {
  return typeof payload.exp === 'number' && payload.exp * 1000 <= nowMs;
}

/**
 * Normalized authorities from the first role claim present: `ROLE_ENCARGADO` → `ENCARGADO`.
 * Accepts strings, arrays, or `{ authority: 'ROLE_ADMIN' }` entries.
 */
export function extractAuthorities(payload: JwtPayload): string[] {
  for (const claim of ROLE_CLAIMS) {
    const authorities = toAuthorities(payload[claim]);
    if (authorities.length > 0) {
      return authorities;
    }
  }
  return [];
}

/** Portal role for the token, or null when no authority maps to a portal (e.g. `ROLE_PENDIENTE`). */
export function extractRole(payload: JwtPayload): Role | null {
  for (const authority of extractAuthorities(payload)) {
    const role = PORTAL_ROLE_BY_AUTHORITY[authority];
    if (role) {
      return role;
    }
  }
  return null;
}

function toAuthorities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(toAuthorities);
  }
  if (typeof value === 'object' && value !== null && 'authority' in value) {
    return toAuthorities(value.authority);
  }
  if (typeof value !== 'string' || value === '') {
    return [];
  }
  return [value.toUpperCase().replace(/^ROLE_/, '')];
}
