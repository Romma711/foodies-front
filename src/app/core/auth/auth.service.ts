import { HttpClient } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_URL } from '../config/api.config';
import {
  AuthResponse,
  LoginRequest,
  PendingApprovalError,
  RegisterClienteRequest,
  RegisterRestauranteRequest,
  Role,
  RoleMismatchError,
  Session,
} from './auth.models';
import { decodeJwt, extractAuthorities, extractRole, isExpired } from './jwt';
import { TokenStorage } from './token-storage';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorage);
  private readonly apiUrl = inject(API_URL);

  private readonly tokens = signal(this.storage.readAll());

  /** Signs in through one role's portal; rejects tokens issued for any other role. */
  login(credentials: LoginRequest, expectedRole: Role): Observable<Session> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      map((response) => {
        const token = (response?.Token ?? '').replace(/^Bearer\s+/i, '');
        const payload = decodeJwt(token);
        const role = payload ? extractRole(payload) : null;
        if (
          payload &&
          expectedRole === 'RESTAURANTE' &&
          extractAuthorities(payload).includes('PENDIENTE')
        ) {
          throw new PendingApprovalError();
        }
        if (!payload || role !== expectedRole) {
          throw new RoleMismatchError(expectedRole, role);
        }
        this.storage.set(role, token);
        this.tokens.update((tokens) => ({ ...tokens, [role]: token }));
        return { role, subject: payload.sub ?? null, token };
      }),
    );
  }

  registerCliente(request: RegisterClienteRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/register/cliente`, request);
  }

  /** Creates a `ROLE_PENDIENTE` account; it can sign in only after an admin approves it. */
  /** Multipart: `datos` en JSON, las `fotos` y en `portada` el índice de la que se muestra en el catálogo. */
  registerRestaurante(
    request: RegisterRestauranteRequest,
    { fotos, portada }: { fotos: readonly File[]; portada: number },
  ): Observable<unknown> {
    const body = new FormData();
    body.append('datos', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    for (const foto of fotos) {
      body.append('fotos', foto, foto.name);
    }
    body.append('portada', String(portada));
    return this.http.post(`${this.apiUrl}/auth/register/restaurante`, body);
  }

  logout(role: Role): void {
    this.storage.clear(role);
    this.tokens.update(({ [role]: _removed, ...rest }) => rest);
  }

  /** Returns the role's token only while it is present and not expired. */
  token(role: Role): string | null {
    const token = this.tokens()[role];
    if (!token) {
      return null;
    }
    const payload = decodeJwt(token);
    if (!payload || isExpired(payload, Date.now())) {
      return null;
    }
    return token;
  }

  isAuthenticated(role: Role): boolean {
    return this.token(role) !== null;
  }

  /** Backend user id from the role's token, used when creating reservations. */
  userId(role: Role): number | null {
    const token = this.token(role);
    if (!token) {
      return null;
    }
    const payload = decodeJwt(token);
    return typeof payload?.usuarioId === 'number' ? payload.usuarioId : null;
  }
}
