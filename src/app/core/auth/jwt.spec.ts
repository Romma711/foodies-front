import { decodeJwt, extractAuthorities, extractRole, isExpired } from './jwt';
import { fakeJwt } from './testing';

describe('jwt', () => {
  it('decodes the payload of a well formed token', () => {
    expect(
      decodeJwt(fakeJwt({ sub: 'ana@foodies.com', role: 'CLIENTE', usuarioId: 7 })),
    ).toEqual({
      sub: 'ana@foodies.com',
      role: 'CLIENTE',
      usuarioId: 7,
    });
  });

  it('returns null for malformed tokens', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull();
    expect(decodeJwt('a.%%%.c')).toBeNull();
  });

  it('detects expiration from the exp claim', () => {
    expect(isExpired({ exp: 100 }, 100_000)).toBe(true);
    expect(isExpired({ exp: 200 }, 100_000)).toBe(false);
    expect(isExpired({}, 100_000)).toBe(false);
  });

  it.each([
    [{ roles: ['ROLE_ADMIN'] }, 'ADMIN'],
    [{ roles: ['ROLE_ENCARGADO'] }, 'RESTAURANTE'],
    [{ roles: ['ROLE_CLIENTE'] }, 'CLIENTE'],
    [{ roles: ['ROLE_PENDIENTE'] }, null],
    [{ role: 'ROLE_RESTAURANTE' }, 'RESTAURANTE'],
    [{ rol: 'cliente' }, 'CLIENTE'],
    [{ authorities: [{ authority: 'ROLE_ADMIN' }] }, 'ADMIN'],
    [{ role: 'SUPERUSER' }, null],
    [{}, null],
  ])('extracts the role from %j', (payload, expected) => {
    expect(extractRole(payload)).toBe(expected);
  });

  it('normalizes authorities from the roles claim', () => {
    expect(extractAuthorities({ roles: ['ROLE_PENDIENTE'] })).toEqual(['PENDIENTE']);
  });
});
