import { JwtPayload } from './auth.models';

/** Builds an unsigned JWT for tests; only the payload matters to the front end. */
export function fakeJwt(payload: JwtPayload): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}

/** Expiry one hour from now, in JWT seconds. */
export function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 3600;
}
