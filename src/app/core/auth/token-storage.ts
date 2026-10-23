import { Service } from '@angular/core';
import { Role, ROLES } from './auth.models';

const KEY_PREFIX = 'foodies.token.';

/** Persists one token per role under its own key so portals never share a session. */
@Service()
export class TokenStorage {
  get(role: Role): string | null {
    try {
      return localStorage.getItem(KEY_PREFIX + role);
    } catch {
      return null;
    }
  }

  set(role: Role, token: string): void {
    try {
      localStorage.setItem(KEY_PREFIX + role, token);
    } catch {
      // Storage unavailable (private mode, blocked site data): the session lives in memory only.
    }
  }

  clear(role: Role): void {
    try {
      localStorage.removeItem(KEY_PREFIX + role);
    } catch {
      // Nothing to clear when storage is unavailable.
    }
  }

  readAll(): Partial<Record<Role, string>> {
    const tokens: Partial<Record<Role, string>> = {};
    for (const role of ROLES) {
      const token = this.get(role);
      if (token) {
        tokens[role] = token;
      }
    }
    return tokens;
  }
}
